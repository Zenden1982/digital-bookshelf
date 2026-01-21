import { XMLParser } from "fast-xml-parser";

export const parseFb2 = (xmlContent) => {
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            textNodeName: "#text"
        });

        const jsonObj = parser.parse(xmlContent);
        const fictionBook = jsonObj.FictionBook;

        if (!fictionBook) {
            throw new Error("Invalid FB2 format");
        }

        const body = fictionBook.body;
        // FB2 might have multiple bodies (notes, etc), usually the first one is the book
        let mainBody = Array.isArray(body) ? body[0] : body;

        // Convert FB2 structure to HTML string
        let htmlContent = "";

        // Title info for displaying if needed, though usually Reader handles title separately
        if (mainBody.title) {
            // htmlContent += `<h1>${extractText(mainBody.title)}</h1>`;
        }

        if (mainBody.section) {
            const sections = Array.isArray(mainBody.section) ? mainBody.section : [mainBody.section];
            sections.forEach(section => {
                htmlContent += processSection(section);
            });
        }

        return htmlContent;
    } catch (error) {
        console.error("Error parsing FB2:", error);
        return null;
    }
};

const processSection = (section) => {
    let html = "<section class='fb2-section'>";

    // Section Title
    if (section.title) {
        html += `<h2 class='fb2-title'>${extractText(section.title)}</h2>`;
    }

    // Section Content
    // FB2 sections can contain <p>, <image>, <poem>, <subtitle>, or nested <section>
    // We need to iterate over keys or ensuring order if parser preserves it (fast-xml-parser usually does if configured, 
    // but object keys iteration is not guaranteed order. strictly speaking we should check valid FB2 schema).
    // For simplicity, we check for 'p', 'image' etc.

    // Note: fast-xml-parser might merge multiple <p> into an array or single object.

    if (section.p) {
        const paragraphs = Array.isArray(section.p) ? section.p : [section.p];
        paragraphs.forEach(p => {
            html += `<p>${extractText(p)}</p>`;
        });
    }

    if (section.image) {
        // images in FB2 are often base64 references. 
        // Handling images requires extracting binaries from <binary> tag at end of file.
        // This is a complex feature. For now, we might skip images or put a placeholder.
        html += `<div class="fb2-image-placeholder">[Image]</div>`;
    }

    // Recursively process nested sections
    if (section.section) {
        const nestedSections = Array.isArray(section.section) ? section.section : [section.section];
        nestedSections.forEach(nested => {
            html += processSection(nested);
        });
    }

    html += "</section>";
    return html;
};

const extractText = (node) => {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (node["#text"]) return node["#text"];

    // If it's mixed content (e.g. <p>Some <strong>bold</strong> text</p>)
    // fast-xml-parser might represent it differently. 
    // For a simple reader, we might just join all values or JSON stringify
    // But usually recursive text extraction is needed.

    // Simple fallback
    return Object.values(node).map(val => extractText(val)).join(" ");
};
