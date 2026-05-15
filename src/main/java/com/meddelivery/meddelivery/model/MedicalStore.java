package com.meddelivery.meddelivery.model;

import jakarta.persistence.*;

@Entity
@Table(name = "medical_store")
public class MedicalStore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_name", length = 100)
    private String storeName;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "owner_id")
    private Long ownerId;

    public MedicalStore() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
}
