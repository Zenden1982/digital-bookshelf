import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale, // Для линейного графика
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";

// Импорт вашего сервиса
import { analyticsService } from "../services/analyticsService";

// === Иконки Material UI ===
import AutoStoriesIcon from "@mui/icons-material/AutoStories"; // Для "Читаю"
import BarChartIcon from "@mui/icons-material/BarChart"; // Иконка графика
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Для прочитанного
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks"; // Для "Всего книг"
import PieChartIcon from "@mui/icons-material/PieChart"; // Иконка графика
import SpeedIcon from "@mui/icons-material/Speed"; // Для страниц (скорость/объем)
import StarIcon from "@mui/icons-material/Star"; // Для рейтинга
import TimelineIcon from "@mui/icons-material/Timeline"; // Иконка графика активности
import TrendingUpIcon from "@mui/icons-material/TrendingUp"; // Заголовок

// Стили
import "./AnalyticsPage.css";

// Регистрация компонентов для графиков
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
);

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        // Используем сервис для получения данных
        const result = await analyticsService.getMyAnalytics();
        setData(result);
      } catch (err) {
        console.error("Ошибка загрузки аналитики:", err);
        setError(err.message || "Не удалось загрузить данные статистики.");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-page-loading">
        <div className="loader-spinner"></div>
        <p>Считаем ваши книги...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="analytics-page-error">
        <p>{error || "Нет данных для отображения"}</p>
      </div>
    );
  }

  // === Подготовка данных для графиков ===

  // 1. Пончик (Статусы книг)
  const statusChartData = {
    labels: ["Прочитано", "Читаю", "В планах"],
    datasets: [
      {
        data: [
          data.booksRead || 0,
          data.booksReading || 0,
          data.booksPlanned || 0,
        ],
        backgroundColor: [
          "#27ae60", // Зеленый
          "#f39c12", // Оранжевый
          "#3498db", // Синий
        ],
        hoverOffset: 4,
        borderWidth: 0,
      },
    ],
  };

  // 2. Столбцы (Топ жанров)
  const genres = data.genreDistribution || {};
  const sortedGenres = Object.entries(genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // Топ 6

  const genreChartData = {
    labels: sortedGenres.map(([name]) => name),
    datasets: [
      {
        label: "Книг",
        data: sortedGenres.map(([, count]) => count),
        backgroundColor: "rgba(139, 69, 19, 0.6)",
        borderColor: "rgba(139, 69, 19, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const genreChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  // 3. Линейный график (Активность по месяцам)
  const activityData = data.monthlyActivity || {};
  const lineChartData = {
    labels: Object.keys(activityData), // Месяцы
    datasets: [
      {
        label: "Прочитано книг",
        data: Object.values(activityData),
        borderColor: "#3498db",
        backgroundColor: "rgba(52, 152, 219, 0.1)",
        tension: 0.4, // Плавные линии
        fill: true,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#3498db",
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: "#f0f0f0" },
      },
      x: {
        grid: { display: false },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>
          <TrendingUpIcon fontSize="large" sx={{ color: "#34495e" }} />
          <span>Моя статистика</span>
        </h1>
        <p>Анализ вашей читательской активности</p>
      </header>

      {/* Сетка карточек с цифрами */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-bg blue">
            <LibraryBooksIcon sx={{ fontSize: 28, color: "white" }} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{data.totalBooks}</span>
            <span className="stat-label">Всего книг</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg green">
            <CheckCircleIcon sx={{ fontSize: 28, color: "white" }} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{data.totalReadingEquivalent}</span>
            <span className="stat-label">Прочитано (экв.)</span>
            <span className="stat-sublabel">по сумме % прогресса</span>
          </div>
        </div>

        {/* НОВАЯ КАРТОЧКА: СТРАНИЦЫ */}
        <div className="stat-card">
          <div className="stat-icon-bg purple">
            <SpeedIcon sx={{ fontSize: 28, color: "white" }} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{data.totalStandardPages || 0}</span>
            <span className="stat-label">Всего страниц</span>
            <span className="stat-sublabel">бумажный эквивалент</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg orange">
            <AutoStoriesIcon sx={{ fontSize: 28, color: "white" }} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{data.booksReading}</span>
            <span className="stat-label">Читаю сейчас</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg yellow">
            <StarIcon sx={{ fontSize: 28, color: "white" }} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{data.averageRating || 0}</span>
            <span className="stat-label">Ср. оценка</span>
          </div>
        </div>
      </div>

      {/* Секция графиков */}
      <div className="charts-section">
        {/* НОВЫЙ ГРАФИК: АКТИВНОСТЬ ПО МЕСЯЦАМ (Широкий) */}
        <div className="chart-card wide full-width">
          <div className="chart-title">
            <TimelineIcon sx={{ color: "#7f8c8d" }} />
            <h3>Динамика чтения (последние 6 месяцев)</h3>
          </div>
          <div className="chart-content line-container">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* График статусов */}
        <div className="chart-card">
          <div className="chart-title">
            <PieChartIcon sx={{ color: "#7f8c8d" }} />
            <h3>Состояние библиотеки</h3>
          </div>
          <div className="chart-content doughnut-container">
            {data.totalBooks > 0 ? (
              <Doughnut
                data={statusChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                }}
              />
            ) : (
              <div className="no-data-placeholder">Нет данных</div>
            )}
          </div>
        </div>

        {/* График жанров */}
        <div className="chart-card wide">
          <div className="chart-title">
            <BarChartIcon sx={{ color: "#7f8c8d" }} />
            <h3>Любимые жанры</h3>
          </div>
          <div className="chart-content bar-container">
            {sortedGenres.length > 0 ? (
              <Bar data={genreChartData} options={genreChartOptions} />
            ) : (
              <div className="no-data-placeholder">Жанры не определены</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
