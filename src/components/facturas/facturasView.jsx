import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, message } from 'antd';
import moment from 'moment';

const FacturasView = ({ facturas, loading, onCrear, onEditar }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [facturaActual, setFacturaActual] = useState(null);

  const [form] = Form.useForm();

  const abrirModal = (factura = null) => {
    setFacturaActual(factura);

    if (factura) {
      form.setFieldsValue({
        IdReserva: factura.IdReserva,
        ValorTotal: factura.ValorTotal,
        FechaEmision: factura.FechaEmision ? moment(factura.FechaEmision) : null,
        UriFactura: factura.UriFactura,
        Descripcion: factura.Descripcion
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ FechaEmision: moment() });
    }

    setModalVisible(true);
  };

  const cerrarModal = () => {
    form.resetFields();
    setFacturaActual(null);
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      const facturaDto = {
        ...values,
        IdFactura: facturaActual ? facturaActual.IdFactura : undefined,
        IdReserva: facturaActual ? facturaActual.IdReserva : values.IdReserva,
        FechaEmision: values.FechaEmision ? values.FechaEmision.toISOString() : null
      };

      if (facturaActual) await onEditar(facturaDto);
      else await onCrear(facturaDto);

      cerrarModal();
    } catch (err) {
      console.error(err);
      message.error("Verifica los campos");
    } finally {
      setSubmitLoading(false);
    }
  };

  const columnas = [
    { title: "ID", dataIndex: "IdFactura", width: 60 },
    { title: "ID Reserva", dataIndex: "IdReserva", width: 100 },
    { 
      title: "Fecha Emisión", 
      dataIndex: "FechaEmision",
      render: (fecha) => fecha ? new Date(fecha).toLocaleDateString() : "-"
    },
    { 
      title: "Valor Total", 
      dataIndex: "ValorTotal",
      render: (valor) => `$ ${parseFloat(valor).toFixed(2)}`
    },
    {
      title: "Documento",
      dataIndex: "UriFactura",
      render: (uri) => uri ? <a href={uri} target="_blank" rel="noopener noreferrer">Ver PDF</a> : "Sin archivo"
    },
    { 
      title: "Descripción", 
      dataIndex: "Descripcion",
      ellipsis: true 
    },
    {
      title: "Acciones",
      width: 200,
      render: (_, factura) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <Button type="primary" size="small" onClick={() => abrirModal(factura)}>Editar</Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Gestión de Facturas</h2>
        <Button type="primary" onClick={() => abrirModal()}>
          Nueva Factura
        </Button>
      </div>

      <Table
        columns={columnas}
        dataSource={facturas}
        loading={loading}
        rowKey={(f) => f.IdFactura}
        pagination={{ pageSize: 8 }}
      />
      <Modal
        title={facturaActual ? "Editar Factura" : "Crear Factura"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={cerrarModal}
        confirmLoading={submitLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="IdReserva" 
            label="ID Reserva" 
            rules={[{ required: true, message: 'Requerido' }]}
          >
            <InputNumber 
                style={{ width: '100%' }} 
                placeholder="Ej: 1" 
                disabled={!!facturaActual} 
            />
          </Form.Item>

          <Form.Item name="ValorTotal" label="Valor Total" rules={[{ required: true, message: 'Requerido' }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              prefix="$" 
              precision={2}
              step={0.01}
            />
          </Form.Item>

          <Form.Item name="FechaEmision" label="Fecha Emisión" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="UriFactura" label="URL Factura (PDF)">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="Descripcion" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default FacturasView;