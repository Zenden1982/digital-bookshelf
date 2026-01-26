package com.diplom.diplom.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import io.documentnode.epub4j.domain.Book;
import io.documentnode.epub4j.domain.Resource;
import io.documentnode.epub4j.epub.EpubReader;

@Service
public class FileParserService {

    // Список разрешенных тегов (чтобы не пролезли скрипты)
    private static final Safelist SAFE_TAGS = Safelist.none()
            .addTags("p", "br", "b", "i", "strong", "em", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
                    "blockquote");

    public String parseContent(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null)
            return "";
        String lowerName = filename.toLowerCase();

        if (lowerName.endsWith(".txt")) {
            // Для TXT просто оборачиваем параграфы в <p>
            String text = new String(file.getBytes(), StandardCharsets.UTF_8);
            return convertTxtToHtml(text);
        } else if (lowerName.endsWith(".fb2")) {
            return parseFb2(file.getInputStream());
        } else if (lowerName.endsWith(".epub")) {
            return parseEpub(file.getInputStream());
        } else {
            throw new IllegalArgumentException("Unsupported file format: " + filename);
        }
    }

    private String convertTxtToHtml(String text) {
        // Превращаем переносы строк в <p>
        String[] paragraphs = text.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        for (String para : paragraphs) {
            if (!para.isBlank()) {
                sb.append("<p>").append(para.trim()).append("</p>");
            }
        }
        return sb.toString();
    }

    private String parseFb2(InputStream inputStream) throws IOException {
        String xml = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        org.jsoup.nodes.Document doc = Jsoup.parse(xml, "", org.jsoup.parser.Parser.xmlParser());
        org.jsoup.nodes.Element body = doc.selectFirst("body");

        if (body != null) {
            // FB2 специфичен: title -> h2, subtitle -> h3, p -> p, emphasis -> i, strong ->
            // b

            // Превращаем FB2 теги в HTML
            body.select("title").tagName("h2");
            body.select("subtitle").tagName("h3");
            body.select("emphasis").tagName("i");
            body.select("strong").tagName("b");
            // Остальные теги (например <image>) можно удалить или обработать

            // Чистим результат, оставляя только HTML
            return Jsoup.clean(body.html(), SAFE_TAGS);
        }
        return convertTxtToHtml(doc.text());
    }

    private String parseEpub(InputStream inputStream) throws IOException {
        EpubReader epubReader = new EpubReader();
        Book book = epubReader.readEpub(inputStream);
        StringBuilder sb = new StringBuilder();

        for (Resource res : book.getContents()) {
            String html = new String(res.getData(), StandardCharsets.UTF_8);

            // Чистим каждую главу, оставляя структуру
            String cleanHtml = Jsoup.clean(html, SAFE_TAGS);
            sb.append(cleanHtml);
        }
        return sb.toString();
    }
}
