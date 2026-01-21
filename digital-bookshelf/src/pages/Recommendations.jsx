import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Box,
  Tab,
  Tabs,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MapIcon from '@mui/icons-material/Map';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import { bookService } from "../services/bookService";

// Mock Data for "Reading Map"
const READING_PATHS = [
  {
    label: "Путь Героя (Фэнтези)",
    description: "Классическое развитие героя от простого парня до спасителя мира.",
    steps: [
      { label: "Хоббит", author: "Дж. Р. Р. Толкин", reason: "Начало великого путешествия" },
      { label: "Властелин Колец", author: "Дж. Р. Р. Толкин", reason: "Эпическое продолжение" },
      { label: "Имя Ветра", author: "Патрик Ротфусс", reason: "Современный взгляд на становление героя" },
    ]
  },
  {
    label: "Киберпанк: Начало",
    description: "Погружение в мрачное будущее высоких технологий.",
    steps: [
      { label: "Нейромант", author: "Уильям Гибсон", reason: "Книга, определившая жанр" },
      { label: "Схизматрица", author: "Брюс Стерлинг", reason: "Глубокое философское осмысление" },
      { label: "Лавина", author: "Нил Стивенсон", reason: "Динамичный и ироничный взгляд" },
    ]
  }
];

const Recommendations = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  // State for tags
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const userTags = await bookService.getUserTags();
        setTags(userTags);
        // If we have tags, auto-select the first one to show something
        if (userTags && userTags.length > 0) {
          fetchRecommendationsByTag(userTags[0]);
        }
      } catch (e) {
        console.error("Failed to load user tags", e);
      }
    };
    loadTags();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedTag(null);
  };

  const fetchRecommendationsByTag = async (tag) => {
    setLoading(true);
    setSelectedTag(tag);
    try {
      const data = await bookService.getRecommendationsByTag(tag);
      setRecommendedBooks(data.content);
    } catch (error) {
      console.error("Failed to load recommendations", error);
    } finally {
      setLoading(false);
    }
  };

  // Removed useEffect for auto-fetch since we do it after loading tags now
  /*
  useEffect(() => {
    if (tabValue === 0 && !selectedTag) {
      fetchRecommendationsByTag("Фантастика");
    }
  }, [tabValue]);
  */

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 'bold' }}>
        <AutoFixHighIcon fontSize="large" color="primary" />
        Что почитать?
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Персональные подборки и карты чтения для вашего развития.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="recommendation tabs" centered>
          <Tab icon={<AutoFixHighIcon />} label="По интересам" />
          <Tab icon={<LocalLibraryIcon />} label="С полки" />
        </Tabs>
      </Box>

      {/* TAB 0: BY INTERESTS */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => fetchRecommendationsByTag(tag)}
                color={selectedTag === tag ? "primary" : "default"}
                variant={selectedTag === tag ? "filled" : "outlined"}
                clickable
                sx={{ fontSize: '1rem', py: 1, px: 2 }}
              />
            ))}
          </Box>

          <Grid container spacing={3}>
            {loading ? (
              <Typography sx={{ width: '100%', textAlign: 'center', mt: 4 }}>Подбираем лучшие книги...</Typography>
            ) : recommendedBooks.length > 0 ? (
              recommendedBooks.map((book) => (
                <Grid item xs={12} sm={6} md={3} key={book.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      cursor: 'pointer',
                      '&:hover': { transform: 'scale(1.03)', boxShadow: 6 }
                    }}
                    onClick={() => navigate(`/book/${book.id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="240"
                      image={book.coverUrl ? `http://localhost:5000${book.coverUrl}` : "https://via.placeholder.com/150"}
                      alt={book.title}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="div" noWrap title={book.title}>
                        {book.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {book.author}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : tags.length === 0 ? (
              <Typography sx={{ width: '100%', textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                У вас пока нет тегов. Добавьте теги к своим книгам в каталоге, чтобы получать рекомендации.
              </Typography>
            ) : (
              <Typography sx={{ width: '100%', textAlign: 'center' }}>Выберите тег для рекомендаций</Typography>
            )}
          </Grid>
        </Box>
      )}

      {/* TAB 1: FROM SHELF */}
      {tabValue === 1 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LocalLibraryIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary">
            Анализируем вашу библиотеку...
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Скоро здесь появятся рекомендации на основе книг, которые вы уже прочитали.
          </Typography>
          <Button variant="contained" sx={{ mt: 4 }} onClick={() => setTabValue(0)}>
            Перейти к жанрам
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Recommendations;
