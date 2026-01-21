package com.diplom.diplom.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = "/**/{path:[^\\.]*}") // Теперь это сработает
    public String redirect() {
        return "forward:/index.html";
    }
}