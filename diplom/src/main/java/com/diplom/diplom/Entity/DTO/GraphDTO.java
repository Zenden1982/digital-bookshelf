package com.diplom.diplom.Entity.DTO;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GraphDTO {
    private List<Node> nodes;
    private List<Link> links;

    @Data
    @AllArgsConstructor
    public static class Node {
        private Long id;
        private String name;
        private String img;
        private String group; // Статус чтения
        private int val; // Рейтинг (влияет на размер)
    }

    @Data
    @AllArgsConstructor
    public static class Link {
        private Long source;
        private Long target;
        private int value; // Толщина связи
    }
}
