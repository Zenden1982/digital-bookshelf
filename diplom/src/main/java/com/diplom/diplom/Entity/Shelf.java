package com.diplom.diplom.Entity;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Entity
@Table(name = "shelves")
@Data
public class Shelf {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    private User user;

    @NotEmpty
    private String name;

    @OneToMany(mappedBy = "shelf", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShelfItem> shelfItems;
}
