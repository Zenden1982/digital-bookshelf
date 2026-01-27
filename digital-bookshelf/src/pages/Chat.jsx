import * as d3 from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/api"; // ваш apiClient
import "./Chat.css"; // лучше вынести CSS в отдельный файл

const STATUS_COLORS = {
  FINISHED: "#27ae60",
  READING: "#e67e22",
  PLAN_TO_READ: "#3498db",
  DEFAULT: "#bdc3c7",
};

const BG_COLOR = "#fdfbf7";
const COLUMN_BG = "#f5f1e8";

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const ReadingMap = () => {
  const navigate = useNavigate();
  const graphRef = useRef(null);

  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  const [dimensions, setDimensions] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  const [zoomLevel, setZoomLevel] = useState(1);

  // чтобы не делать setState на каждом кадре рендера графа
  const zoomRafRef = useRef(null);
  const lastZoomRef = useRef(1);

  // --- 1) Загрузка данных ---
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);

        // ожидаем GET /api/v1/map (т.к. baseURL у apiClient = /api/v1)
        const res = await apiClient.get("/map");
        const responseData = res.data;

        const nodes = (responseData?.nodes || []).map((n) => ({
          ...n,
          // нормализуем group
          group: n.group || "DEFAULT",
          // нормализуем val
          val: typeof n.val === "number" ? n.val : 1,
        }));

        const links = responseData?.links || [];

        // предзагрузка картинок
        nodes.forEach((node) => {
          if (node.img) {
            const img = new Image();
            img.src = node.img;
            node.imgObj = img;
          }
        });

        setData({ nodes, links });
      } catch (error) {
        console.error("Ошибка загрузки карты:", error);
        setData({ nodes: [], links: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();

    const handleResize = () => {
      setDimensions({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- 2) Настройка сил (самое важное) ---
  useEffect(() => {
    if (!graphRef.current) return;
    if (!data.nodes?.length) return;

    const fg = graphRef.current;

    // 1) Отталкивание (делаем сильнее)
    const charge = fg.d3Force("charge");
    if (charge) charge.strength(-260).distanceMax(900);

    // 2) Ссылки: увеличиваем расстояние, чуть ослабляем "пружину"
    const linkForce = fg.d3Force("link");
    if (linkForce) {
      linkForce
        .distance((link) => {
          const v = typeof link.value === "number" ? link.value : 1;
          // чем сильнее связь — тем ближе, но не слишком близко
          return clamp(260 / (v * 0.8), 140, 340);
        })
        .strength(0.08);
    }

    // 3) Главная сила против «слипания» — collide
    // Радиус коллизии зависит от размера узла
    fg.d3Force(
      "collide",
      d3
        .forceCollide((node) => {
          const base = 14;
          const r = base + (node.val || 1) * 2.2;
          return r + 6; // +gap
        })
        .iterations(2),
    );

    // 4) Центрирование
    fg.d3Force("center", d3.forceCenter(0, 0));

    // 5) Разводим статусы по "зонам" (чтобы кластеры не лежали в одной куче)
    // FINISHED слева, READING по центру, PLAN справа
    fg.d3Force(
      "x",
      d3
        .forceX((node) => {
          if (node.group === "FINISHED") return -dimensions.w * 0.18;
          if (node.group === "READING") return 0;
          if (node.group === "PLAN_TO_READ") return dimensions.w * 0.18;
          return 0;
        })
        .strength(0.06),
    );

    fg.d3Force(
      "y",
      d3
        .forceY((node) => {
          // чуть разнести по вертикали крупные/важные
          const v = node.val || 1;
          return v > 4 ? -60 : 0;
        })
        .strength(0.03),
    );

    // Перезапускаем симуляцию
    fg.d3ReheatSimulation();
  }, [data.nodes, data.links, dimensions.w, dimensions.h]);

  // --- 3) Управление ---
  const handleNodeClick = (node) => {
    if (!graphRef.current) return;
    graphRef.current.centerAt(node.x, node.y, 700);
    graphRef.current.zoom(2.6, 700);
  };

  const handleNodeRightClick = (node) => {
    // у вас ранее было /books/${node.id}, в проекте встречалось /book/:id
    // выберите правильный роут:
    navigate(`/book/${node.id}`);
  };

  const handleZoomIn = () => {
    if (!graphRef.current) return;
    const current = graphRef.current.zoom();
    graphRef.current.zoom(Math.min(current * 1.35, 8), 250);
  };

  const handleZoomOut = () => {
    if (!graphRef.current) return;
    const current = graphRef.current.zoom();
    graphRef.current.zoom(Math.max(current / 1.35, 0.5), 250);
  };

  const handleResetView = () => {
    if (!graphRef.current) return;
    graphRef.current.zoomToFit(450, 60);
  };

  // --- 4) Рисование узлов (улучшено) ---
  const paintNode = (node, ctx, globalScale) => {
    // Обновление zoom-индикатора без спама setState
    const z = globalScale;
    if (Math.abs(z - lastZoomRef.current) > 0.08) {
      lastZoomRef.current = z;
      cancelAnimationFrame(zoomRafRef.current);
      zoomRafRef.current = requestAnimationFrame(() => setZoomLevel(z));
    }

    const val = node.val || 1;
    const radius = clamp(10 + val * 2.2, 12, 26);

    const borderColor = STATUS_COLORS[node.group] || STATUS_COLORS.DEFAULT;

    // Тень
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Обводка статуса
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI);
    ctx.fillStyle = borderColor;
    ctx.fill();

    // Белая подложка
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Аватар/обложка
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius - 1.5, 0, 2 * Math.PI);
    ctx.clip();

    if (node.imgObj) {
      try {
        ctx.drawImage(
          node.imgObj,
          node.x - (radius - 1.5),
          node.y - (radius - 1.5),
          (radius - 1.5) * 2,
          (radius - 1.5) * 2,
        );
      } catch (_) {}
    } else {
      ctx.fillStyle = "#ecf0f1";
      ctx.fillRect(
        node.x - (radius - 1.5),
        node.y - (radius - 1.5),
        (radius - 1.5) * 2,
        (radius - 1.5) * 2,
      );
    }

    ctx.restore();

    // Подпись (при увеличении)
    const showText = globalScale > 1.15 || val > 4;
    if (showText) {
      const fontSize = clamp(12 / globalScale, 7, 14);
      const textY = node.y + radius + fontSize + 6;

      ctx.font = `600 ${fontSize}px Inter, system-ui, -apple-system, Segoe UI, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // halo
      ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
      ctx.lineWidth = 4;
      ctx.strokeText(node.name || "", node.x, textY);

      ctx.fillStyle = "#2c3e50";
      ctx.fillText(node.name || "", node.x, textY);
    }
  };

  // область клика побольше
  const nodePointerAreaPaint = (node, color, ctx) => {
    const val = node.val || 1;
    const radius = clamp(12 + val * 2.2, 14, 30) + 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fill();
  };

  const linkColor = useMemo(() => "rgba(100, 100, 100, 0.18)", []);

  if (loading) {
    return (
      <div className="map-loader" style={{ backgroundColor: COLUMN_BG }}>
        <div className="map-loader-spinner"></div>
        <h2>Строим карту смыслов...</h2>
      </div>
    );
  }

  return (
    <div
      className="reading-map-container"
      style={{ backgroundColor: COLUMN_BG }}
    >
      {/* UI: Легенда */}
      <div className="map-ui-overlay">
        <h1>Карта чтения</h1>
        <p>Книги притягиваются по смыслу и статусу.</p>

        <div className="legend">
          <div className="legend-item">
            <span className="dot finished"></span> Прочитано
          </div>
          <div className="legend-item">
            <span className="dot reading"></span> Читаю
          </div>
          <div className="legend-item">
            <span className="dot planned"></span> В планах
          </div>
        </div>

        <p className="hint">ЛКМ — фокус, ПКМ — открыть книгу</p>
      </div>

      {/* UI: Кнопки */}
      <div className="map-controls">
        <button
          onClick={handleZoomIn}
          className="map-control-btn"
          title="Приблизить"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="map-control-btn"
          title="Отдалить"
        >
          −
        </button>
        <button
          onClick={handleResetView}
          className="map-control-btn reset"
          title="Сброс"
        >
          ⟲
        </button>
      </div>

      <div className="zoom-indicator">{Math.round(zoomLevel * 100)}%</div>

      <ForceGraph2D
        ref={graphRef}
        width={dimensions.w}
        height={dimensions.h}
        graphData={data}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={nodePointerAreaPaint}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleNodeRightClick}
        linkColor={() => linkColor}
        linkWidth={(link) => clamp(Math.sqrt(link.value || 1) * 1.1, 0.6, 3)}
        linkDirectionalParticles={0} // можно включить 1-2 для красоты, но не обязательно
        backgroundColor={BG_COLOR}
        enableNodeDrag={true}
        cooldownTicks={140}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.35}
      />
    </div>
  );
};

export default ReadingMap;
