package com.example.alarmasmart;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class ContactAdapter extends RecyclerView.Adapter<ContactAdapter.ContactViewHolder> {

    private final List<Contact> contactList;
    private final OnContactDeleteListener deleteListener;

    public interface OnContactDeleteListener {
        void onDeleteClick(Contact contact);
    }

    public ContactAdapter(List<Contact> contactList, OnContactDeleteListener deleteListener) {
        this.contactList = contactList;
        this.deleteListener = deleteListener;
    }

    @NonNull
    @Override
    public ContactViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_contacto, parent, false);
        return new ContactViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ContactViewHolder holder, int position) {
        Contact contact = contactList.get(position);
        holder.textNombre.setText(contact.getNombre());
        holder.textTelefono.setText(contact.getTelefono());
        // Configurar un long click para eliminar
        holder.itemView.setOnLongClickListener(v -> {
            deleteListener.onDeleteClick(contact);
            return true;
        });
    }

    @Override
    public int getItemCount() {
        return contactList.size();
    }

    // --- Métodos para manipular los datos del adapter ---

    public void setData(List<Contact> newContactList) {
        contactList.clear();
        contactList.addAll(newContactList);
        notifyDataSetChanged();
    }

    public void addContact(Contact contact) {
        contactList.add(contact);
        notifyItemInserted(contactList.size() - 1);
    }

    public void removeContact(String contactId) {
        for (int i = 0; i < contactList.size(); i++) {
            if (contactList.get(i).getId().equals(contactId)) {
                contactList.remove(i);
                notifyItemRemoved(i);
                return;
            }
        }
    }

    public List<Contact> getData() {
        return contactList;
    }

    // --- ViewHolder ---

    static class ContactViewHolder extends RecyclerView.ViewHolder {
        TextView textNombre;
        TextView textTelefono;

        public ContactViewHolder(@NonNull View itemView) {
            super(itemView);
            textNombre = itemView.findViewById(R.id.tvNombre);
            textTelefono = itemView.findViewById(R.id.tvTelefono);
        }
    }
}