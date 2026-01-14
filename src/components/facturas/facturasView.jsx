import React, { useState } from 'react';
import { Table, Button, Modal, Form, InputNumber, Select, Space, message } from 'antd'; 
import { FilePdfOutlined, ExclamationCircleOutlined, DeleteOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
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
  api,
  onEliminar, 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [facturaActual, setFacturaActual] = useState(null);
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [facturaAEliminar, setFacturaAEliminar] = useState(null);

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

  const abrirModalEliminar = (factura) => {
    setFacturaAEliminar(factura);
    setModalEliminarVisible(true);
  };

  const confirmarEliminar = async () => {
    if (!facturaAEliminar) return;

    try {
      await onEliminar(facturaAEliminar.IdFactura);
      setModalEliminarVisible(false); 
      setFacturaAEliminar(null);
    } catch (err) {
      setModalEliminarVisible(false);
      setFacturaAEliminar(null);
    }
  };

  // ✅ FUNCIÓN PARA ABRIR LA FACTURA PDF
  const verFacturaPDF = (factura) => {
    if (!factura.UriFactura) {
      message.warning('La factura aún no ha sido generada');
      return;
    }

    // Abrir directamente la URL del PDF de Cloudinary
    window.open(factura.UriFactura, '_blank');
  };

  const columnas = [
    { 
      title: "ID", 
      dataIndex: "IdFactura", 
      width: 80,
      align: 'center'
    },
    { 
      title: "ID Reserva", 
      dataIndex: "IdReserva", 
      width: 100,
      align: 'center'
    },
    { 
      title: "Fecha Emisión", 
      dataIndex: "FechaEmision",
      width: 180,
      render: (fecha) => fecha ? moment(fecha).format('DD/MM/YYYY HH:mm') : "-"
    },
    { 
      title: "Valor Total", 
      dataIndex: "ValorTotal",
      width: 120,
      align: 'right',
      render: (valor) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          ${parseFloat(valor).toFixed(2)}
        </span>
      )
    },
    {
      title: "Factura PDF",
      dataIndex: "UriFactura",
      width: 150,
      align: 'center',
      render: (uri, record) => uri ? (
        <Button 
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={() => verFacturaPDF(record)}
          style={{ 
            backgroundColor: '#ff4d4f',
            borderColor: '#ff4d4f'
          }}
        >
          Ver PDF
        </Button>
      ) : (
        <span style={{ color: '#999', fontSize: '12px' }}>
          ⏳ Generando...
        </span>
      )
    },
    {
      title: "Acciones",
      width: 180,
      align: 'center',
      render: (_, factura) => esAdmin && (
        <Space size="small">
          <Button 
            type="primary" 
            size="small" 
            onClick={() => abrirModal(factura)}
          >
            Editar
          </Button>
          <Button 
            danger
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => abrirModalEliminar(factura)} 
          >
            Eliminar
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24 
      }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>
          📄 Gestión de Facturas ({facturas.length})
        </h2>
        {esAdmin && (
          <Button 
            type="primary" 
            size="large"
            onClick={() => abrirModal()}
          >
            + Nueva Factura
          </Button>
        )}
      </div>

      <Table
        columns={columnas}
        dataSource={facturas}
        loading={loading}
        rowKey={(f) => f.IdFactura}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} facturas`
        }}
        bordered
      />

      {/* MODAL DE CREACIÓN/EDICIÓN */}
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

      {/* MODAL DE ELIMINACIÓN */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
            <span>Confirmar eliminación</span>
          </div>
        }
        open={modalEliminarVisible}
        okText="Sí, eliminar"
        okButtonProps={{ danger: true }}
        cancelText="Cancelar"
        onCancel={() => setModalEliminarVisible(false)}
        onOk={confirmarEliminar}
        destroyOnClose={true}
      >
        <div style={{ paddingLeft: '36px' }}>
          <p style={{ margin: '8px 0', fontSize: '15px' }}>
            ¿Estás seguro de eliminar la factura <strong>#{facturaAEliminar?.IdFactura}</strong> de la Reserva <strong>#{facturaAEliminar?.IdReserva}</strong>?
          </p>
          <p style={{ color: '#ff4d4f', fontSize: '13px', margin: '8px 0 0 0' }}>
            ⚠️ Esta acción es permanente y no se puede deshacer.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default FacturasView;