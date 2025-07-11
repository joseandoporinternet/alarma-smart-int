package com.example.alarmasmart;

public class Contact {
    private String id;
    private String nombre;
    private String telefono;

    public Contact(String id, String nombre, String telefono) {
        this.id = id;
        this.nombre = nombre;
        this.telefono = telefono;
    }

    public String getId() { return id; }
    public String getNombre() { return nombre; }
    public String getTelefono() { return telefono; }
}