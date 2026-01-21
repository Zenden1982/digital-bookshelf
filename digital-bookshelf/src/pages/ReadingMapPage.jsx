import { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Grid,
    Box,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Button,
    TextField,
    Autocomplete,
    Paper,
    Card,
    CardContent,
    CardMedia,
    CircularProgress
} from "@mui/material";
import MapIcon from '@mui/icons-material/Map';
import RouteIcon from '@mui/icons-material/Route';
import { useNavigate } from "react-router-dom";
import { bookService } from "../services/bookService";

const ReadingMapPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [seedBook, setSeedBook] = useState(null);
    const [pathLength, setPathLength] = useState(5);
    const [generatedPath, setGeneratedPath] = useState([]);

    const [bookOptions, setBookOptions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Auto-search for books when typing
    const handleSearchBooks = async (event, value) => {
        if (!value || value.length < 2) return;
        setSearchLoading(true);
        try {
            const res = await bookService.searchLocal(value, 0, 10);
            setBookOptions(res.content);
        } catch (e) {
            console.error(e);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleGenerateMap = async () => {
        if (!seedBook) return;
        setLoading(true);
        try {
            const path = await bookService.generateReadingMap(seedBook.id, pathLength);
            setGeneratedPath(path);
        } catch (e) {
            console.error("Failed to generate map", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
            <Box sx={{ mb: 6, textAlign: "center" }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: "bold", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <MapIcon sx={{ fontSize: 48, color: "secondary.main" }} />
                    Карта Чтения
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Постройте свой уникальный путь через мир книг
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Left Column: Controls */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Настройки маршрута
                        </Typography>

                        <Box sx={{ mt: 3, mb: 3 }}>
                            <Autocomplete
                                options={bookOptions}
                                getOptionLabel={(option) => `${option.title} (${option.author})`}
                                loading={searchLoading}
                                onInputChange={handleSearchBooks}
                                onChange={(e, val) => setSeedBook(val)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Стартовая книга"
                                        placeholder="Введите название..."
                                        variant="outlined"
                                        fullWidth
                                    />
                                )}
                            />
                        </Box>

                        <Box sx={{ mb: 4 }}>
                            <TextField
                                label="Длина пути (книг)"
                                type="number"
                                value={pathLength}
                                onChange={(e) => setPathLength(Math.min(20, Math.max(2, parseInt(e.target.value) || 5)))}
                                fullWidth
                                inputProps={{ min: 2, max: 20 }}
                            />
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={handleGenerateMap}
                            disabled={!seedBook || loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RouteIcon />}
                        >
                            {loading ? "Строим маршрут..." : "Проложить путь"}
                        </Button>
                    </Paper>
                </Grid>

                {/* Right Column: The Map */}
                <Grid item xs={12} md={8}>
                    {generatedPath.length > 0 ? (
                        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                                Ваш маршрут
                            </Typography>

                            <Stepper orientation="vertical">
                                {generatedPath.map((book, index) => (
                                    <Step key={book.id} active={true} expanded={true}>
                                        <StepLabel icon={index + 1}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate(`/book/${book.id}`)}>
                                                {book.title}
                                            </Typography>
                                        </StepLabel>
                                        <StepContent>
                                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                                <Grid item xs={3}>
                                                    <img
                                                        src={book.coverUrl || "https://via.placeholder.com/100"}
                                                        alt={book.title}
                                                        style={{ width: '100%', borderRadius: 4, cursor: 'pointer' }}
                                                        onClick={() => navigate(`/book/${book.id}`)}
                                                    />
                                                </Grid>
                                                <Grid item xs={9}>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        Автор: {book.author}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ maxHeight: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {book.annotation ? book.annotation.substring(0, 150) + "..." : "Нет описания"}
                                                    </Typography>
                                                    <Button size="small" sx={{ mt: 1 }} onClick={() => navigate(`/book/${book.id}`)}>
                                                        Перейти к книге
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </StepContent>
                                    </Step>
                                ))}
                            </Stepper>
                        </Paper>
                    ) : (
                        <Box sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.5,
                            minHeight: 400,
                            border: '2px dashed #ccc',
                            borderRadius: 2
                        }}>
                            <MapIcon sx={{ fontSize: 80, mb: 2 }} />
                            <Typography variant="h6">Маршрут пока не построен</Typography>
                            <Typography>Выберите книгу и нажмите "Проложить путь"</Typography>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
};

export default ReadingMapPage;
