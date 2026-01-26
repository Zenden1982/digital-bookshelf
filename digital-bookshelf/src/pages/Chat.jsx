import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Chat.css";

const ReadingMap = () => {
  const navigate = useNavigate();
  const graphRef = useRef();

  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const [zoomLevel, setZoomLevel] = useState(1);

  // --- 1. Загрузка данных ---
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const res = await api.get("/map");
        const responseData = res.data || res;

        const nodes = responseData.nodes || [];
        const links = responseData.links || [];

        // Предзагрузка картинок
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

  // --- 2. Обработчики ---
  const handleNodeClick = (node) => {
    graphRef.current.centerAt(node.x, node.y, 1000);
    graphRef.current.zoom(3, 1000);
  };

  const handleRightClick = (node) => {
    navigate(`/books/${node.id}`);
  };

  const handleZoomIn = () => {
    const currentZoom = graphRef.current.zoom();
    graphRef.current.zoom(Math.min(currentZoom * 1.5, 8), 400);
  };

  const handleZoomOut = () => {
    const currentZoom = graphRef.current.zoom();
    graphRef.current.zoom(Math.max(currentZoom / 1.5, 0.5), 400);
  };

  const handleResetView = () => {
    graphRef.current.zoomToFit(400);
  };

  // --- 3. Улучшенная Отрисовка Узла ---
  const paintNode = (node, ctx, globalScale) => {
    // Сохраняем зум для UI
    if (Math.abs(globalScale - zoomLevel) > 0.1) {
      setZoomLevel(globalScale);
    }

    // Базовый размер
    const baseRadius = 8;
    // Увеличиваем радиус в зависимости от важности (val)
    const radius = baseRadius + node.val * 1.5;

    // Цвета статусов
    let borderColor = "#bdc3c7";
    if (node.group === "FINISHED")
      borderColor = "#27ae60"; // Сочный зеленый
    else if (node.group === "READING")
      borderColor = "#d35400"; // Темно-оранжевый
    else if (node.group === "PLAN_TO_READ") borderColor = "#2980b9"; // Темно-синий

    // --- ТЕНЬ (Глубина) ---
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // --- 1. Внешняя обводка (Статус) ---
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = borderColor;
    ctx.fill();

    // Сбрасываем тень для внутренних элементов, чтобы не было грязи
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // --- 2. Белая подложка (border gap) ---
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // --- 3. Картинка ---
    if (node.imgObj) {
      ctx.save();
      ctx.beginPath();
      // Картинка чуть меньше белой подложки
      ctx.arc(node.x, node.y, radius - 1.5, 0, 2 * Math.PI, false);
      ctx.clip();
      try {
        ctx.drawImage(
          node.imgObj,
          node.x - (radius - 1.5),
          node.y - (radius - 1.5),
          (radius - 1.5) * 2,
          (radius - 1.5) * 2,
        );
      } catch (e) {}
      ctx.restore();
    } else {
      // Если нет картинки — серая заглушка
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius - 1.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = "#ecf0f1";
      ctx.fill();
    }

    // --- 4. Текст (Smart Label) ---
    // Показываем текст, если зум > 1.2 ИЛИ если узел очень важный (val > 4)
    const showText = globalScale > 1.2 || node.val > 4;

    if (showText) {
      const fontSize = 12 / globalScale; // Шрифт не становится гигантским при зуме
      // Ограничиваем мин/макс размер шрифта для читаемости
      const safeFontSize = Math.min(Math.max(fontSize, 4), 16);

      ctx.font = `600 ${safeFontSize}px "Inter", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textY = node.y + radius + safeFontSize + 2;

      // ОБВОДКА ТЕКСТА (HALO) — самое важное для читаемости
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.strokeText(node.name, node.x, textY);

      // САМ ТЕКСТ
      ctx.fillStyle = "#2c3e50";
      ctx.fillText(node.name, node.x, textY);
    }
  };

  if (loading) {
    return (
      <div className="map-loader">
        <div className="map-loader-spinner"></div>
        <h2>Строим карту смыслов...</h2>
      </div>
    );
  }

  return (
    <div className="reading-map-container">
      {/* UI: Легенда */}
      <div className="map-ui-overlay">
        <h1>Карта Чтения</h1>
        <p>Книги притягиваются по смыслу.</p>

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
        <p className="hint">ЛКМ — зум, ПКМ — открыть</p>
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
        // --- НАСТРОЙКА РАССТОЯНИЙ (ФИЗИКА) ---

        // 1. Увеличиваем силу отталкивания (по умолчанию около -30)
        // Ставим -120, чтобы книги сильнее разлетались в стороны
        d3Force={("charge", (force) => force.strength(-120))}
        // 2. Увеличиваем длину связей
        // Раньше было: 100 / ...
        // Ставим: 250 / ... — это сделает нити в 2.5 раза длиннее
        linkDistance={(link) => 1000 / (link.value * 0.5)}
        // Остальные настройки оставляем как есть
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.4}
        cooldownTicks={100}
        linkColor={() => "rgba(100, 100, 100, 0.2)"}
        linkWidth={(link) => Math.sqrt(link.value) * 1.2}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val * 2 + 10, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleRightClick}
        backgroundColor="#fdfbf7"
        enableNodeDrag={true}
      />
    </div>
  );
};

export default ReadingMap;
