import React, { useState } from 'react';
import { Table, Button, Modal, Form, InputNumber, Select } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;

const FacturasView = ({ 
  facturas, 
  loading, 
  usuarios = [], 
  reservas = [], 
  esAdmin, 
  onCrear, 
  onEditar, 
  api 
}) => {
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
      });
    } else {
      form.resetFields();
    }

    setModalVisible(true);
  };

  const handleReservaChange = (idReserva) => {
    const reservaSeleccionada = reservas.find(r => r.IdReserva === idReserva);
    
    if (reservaSeleccionada && reservaSeleccionada.Total) {
      form.setFieldsValue({
        ValorTotal: parseFloat(reservaSeleccionada.Total)
      });
    }
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

      if (facturaActual) {
        const facturaDto = {
          IdFactura: facturaActual.IdFactura,
          IdReserva: facturaActual.IdReserva,
          ValorTotal: values.ValorTotal,
        };
        await onEditar(facturaDto);
      } else {
        const facturaDto = {
          IdReserva: values.IdReserva,
          ValorTotal: values.ValorTotal
        };
        await onCrear(facturaDto);
      }

      cerrarModal();
    } catch (err) {
      console.error(err);
      api.error({ 
        message: 'Formulario incompleto', 
        description: 'Verifica que todos los campos estén completos' 
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const columnas = [
    { 
      title: "ID", 
      dataIndex: "IdFactura", 
      width: 60 
    },
    { 
      title: "ID Reserva", 
      dataIndex: "IdReserva", 
      width: 100 
    },
    { 
      title: "Fecha Emisión", 
      dataIndex: "FechaEmision",
      render: (fecha) => fecha ? moment(fecha).format('DD/MM/YYYY HH:mm') : "-"
    },
    { 
      title: "Valor Total", 
      dataIndex: "ValorTotal",
      render: (valor) => `$${parseFloat(valor).toFixed(2)}`
    },
    {
      title: "PDF",
      dataIndex: "UriFactura",
      render: (uri) => uri ? (
        <Button 
          type="link" 
          icon={<FilePdfOutlined />}
          href={uri} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          Ver PDF
        </Button>
      ) : "Generando..."
    },
    {
      title: "Acciones",
      width: 150,
      render: (_, factura) => esAdmin && (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => abrirModal(factura)}
        >
          Editar
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2>📄 Gestión de Facturas</h2>
        {esAdmin && (
          <Button type="primary" onClick={() => abrirModal()}>
            + Nueva Factura
          </Button>
        )}
      </div>

      <Table
        columns={columnas}
        dataSource={facturas}
        loading={loading}
        rowKey={(f) => f.IdFactura}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {facturaActual ? "✏️ Editar Factura" : "📝 Crear Nueva Factura"}
          </span>
        }
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={cerrarModal}
        confirmLoading={submitLoading}
        okText={facturaActual ? "Actualizar" : "Crear Factura"}
        cancelText="Cancelar"
        width={600}
      >
        <Form form={form} layout="vertical">
          
          {/* SELECT DE RESERVAS */}
          <Form.Item 
            name="IdReserva" 
            label="🎫 Reserva"
            rules={[{ required: true, message: 'Selecciona una reserva' }]}
          >
            <Select 
              placeholder="Selecciona una reserva"
              showSearch
              disabled={!!facturaActual}
              onChange={handleReservaChange}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {reservas.map(reserva => (
                <Option key={reserva.IdReserva} value={reserva.IdReserva}>
                  Reserva #{reserva.IdReserva} - {reserva.NombreUsuario || `Usuario ${reserva.IdUsuario}`} - {reserva.VehiculoNombre || 'Vehículo'}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item 
            name="ValorTotal" 
            label="💵 Valor Total"
            rules={[
              { required: true, message: 'Ingresa el valor total' },
              { type: 'number', min: 0.01, message: 'Debe ser mayor a 0' }
            ]}
            tooltip="Este valor se carga automáticamente desde la reserva (incluye IVA 15%)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              prefix="$" 
              precision={2}
              step={0.01}
              placeholder="Se llenará automáticamente al seleccionar reserva"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FacturasView;