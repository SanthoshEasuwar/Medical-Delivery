-- MedDelivery MySQL Schema
-- Run this once on your MySQL before starting the app
-- Or let ddl-auto=update handle it automatically

CREATE DATABASE IF NOT EXISTS med_delivery;
USE med_delivery;

CREATE TABLE IF NOT EXISTS users (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(100),
    email    VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role     VARCHAR(20)  NOT NULL,
    active   BOOLEAN      NOT NULL DEFAULT TRUE   -- ✅ ADD THIS LINE
);

CREATE TABLE IF NOT EXISTS medical_store (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    store_name VARCHAR(100),
    location   VARCHAR(200),
    address    VARCHAR(255),
    owner_id   BIGINT
);

CREATE TABLE IF NOT EXISTS medicine (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(100),
    price    DOUBLE,
    store_id BIGINT,
    stock    INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id       BIGINT,
    store_id         BIGINT,
    order_status     VARCHAR(30),
    order_time       DATETIME,
    created_at       DATETIME,
    updated_at       DATETIME,
    customer_email   VARCHAR(255),
    customer_name    VARCHAR(255),
    customer_phone   VARCHAR(255),
    delivery_address VARCHAR(255),
    prescription_file_path VARCHAR(500),
    total_amount     DOUBLE
);

CREATE TABLE IF NOT EXISTS order_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT,
    medicine_id BIGINT,
    quantity    INT    NOT NULL,
    unit_price  DOUBLE NOT NULL,
    subtotal    DOUBLE,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS prescription_requests (
    id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id             BIGINT,
    store_id               BIGINT,
    patient_name           VARCHAR(255),
    patient_email          VARCHAR(255),
    patient_phone          VARCHAR(255),
    delivery_address       VARCHAR(500),
    patient_note           VARCHAR(1000),
    prescription_file_path VARCHAR(500),
    medicine_summary       VARCHAR(1000),
    bill_amount            DOUBLE,
    store_message          VARCHAR(1000),
    status                 VARCHAR(30),
    order_status           VARCHAR(30),
    created_at             DATETIME,
    updated_at             DATETIME
);

