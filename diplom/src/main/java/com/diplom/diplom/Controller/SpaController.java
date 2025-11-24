package com.diplom.diplom.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    // Перенаправляем все запросы, которые не API и не статика (с расширением), на
    // index.html
    // Регулярка исключает пути с точкой (напр. style.css) и пути, начинающиеся с
    // /api
    @RequestMapping(value = "/**/{path:[^\\.]*}") // Теперь это сработает
    public String redirect() {
        return "forward:/index.html";
    }
}