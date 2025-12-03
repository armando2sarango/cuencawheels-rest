import React from 'react';
import './Home.css';
import { Row, Col, Card, Typography, Statistic, Space, Button, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';

import {
  SmileOutlined, CarOutlined, TrophyOutlined, EnvironmentOutlined, CalendarOutlined, ScheduleOutlined, TeamOutlined, PhoneOutlined, MailOutlined, HomeOutlined, ClockCircleOutlined, FacebookOutlined, InstagramOutlined, TwitterOutlined, LinkedinOutlined
} from '@ant-design/icons'; 
const { Title, Paragraph, Text } = Typography;

const HomeView = () => {
  const navigate = useNavigate();

  const empresaInfo = {
    nombre: "Cuenca Wheels",
    descripcion: "Líder en alquiler de vehículos con más de 10 años de experiencia",
    mision: "Proporcionar soluciones de movilidad confiables y accesibles para nuestros clientes, ofreciendo vehículos de calidad y un servicio excepcional que supere las expectativas.",
    vision: "Ser la empresa de alquiler de vehículos más confiable y preferida en Ecuador, reconocida por nuestra excelencia en el servicio y compromiso con la satisfacción del cliente.",
    valores: [
      "Compromiso con el cliente",
      "Calidad en el servicio",
      "Integridad y transparencia",
      "Innovación constante"
    ],
    estadisticas: [
      { titulo: "Clientes Satisfechos", valor: "5000+", icono: "smile" },
      { titulo: "Vehículos Disponibles", valor: "150+", icono: "car" },
      { titulo: "Años de Experiencia", valor: "10+", icono: "trophy" },
      { titulo: "Ciudades Cubiertas", valor: "15+", icono: "environment" }
    ],
    servicios: [
      {
        titulo: "Alquiler Diario",
        descripcion: "Vehículos disponibles por día con tarifas competitivas y sin compromisos a largo plazo.",
        icono: "calendar"
      },
      {
        titulo: "Alquiler Mensual",
        descripcion: "Planes especiales para alquileres de larga duración con descuentos atractivos.",
        icono: "schedule"
      },
      {
        titulo: "Servicio Corporativo",
        descripcion: "Soluciones personalizadas para empresas con flotas y servicios exclusivos.",
        icono: "team"
      },
      {
        titulo: "Asistencia 24/7",
        descripcion: "Soporte y asistencia en carretera las 24 horas del día, los 7 días de la semana.",
        icono: "phone"
      }
    ],
    contacto: {
      telefono: "+593 958832936",
      email: "cuentarentcar@gmail.com",
      direccion: "Av. Orellana E4-431 y Juan León Mera, junto al hotel Marriot.",
      horario: "Lunes a Viernes: 8:00 AM - 6:00 PM | Sábados: 9:00 AM - 2:00 PM"
    },
    redes: {
      facebook: "https://facebook.com/cuencawheels",
      instagram: "https://instagram.com/cuencawheels",
      twitter: "https://twitter.com/cuencawheels",
      linkedin: "https://linkedin.com/company/cuencawheels"
    }
  };

  const iconMap = {
    smile: <SmileOutlined />,
    car: <CarOutlined />,
    trophy: <TrophyOutlined />,
    environment: <EnvironmentOutlined />,
    calendar: <CalendarOutlined />,
    schedule: <ScheduleOutlined />,
    team: <TeamOutlined />,
    phone: <PhoneOutlined />,
    facebook: <FacebookOutlined />,
    instagram: <InstagramOutlined />,
    twitter: <TwitterOutlined />,
    linkedin: <LinkedinOutlined />
  };

  const renderIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    if (IconComponent) {
      return React.cloneElement(IconComponent, { style: { fontSize: '40px' } });
    }
    return null;
  };

  // Componente de Redes Sociales
  const SocialMedia = () => (
    <Space size="large" className="social-media-container">
      {Object.entries(empresaInfo.redes).map(([key, url]) => (
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="social-icon-link">
          {iconMap[key]}
        </a>
      ))}
    </Space>
  );

  return (
    <div className="home-container">

      {/* 🌟 Sección Hero con Fondo Animado */}
      <div className="hero-section">
        <Title level={1} className="hero-title">
          {empresaInfo.nombre}
        </Title>
        <Paragraph className="hero-subtitle">
          {empresaInfo.descripcion}
        </Paragraph>
        <Space size="large">
          <Button
            size="large"
            className="hero-button primary"
            onClick={() => navigate('/autos')}
          >
            <CarOutlined /> Ver Vehículos
          </Button>
          <Button
            size="large"
            className="hero-button secondary"
            onClick={() => window.open('https://wa.link/0an2d8', '_blank')}
          >
            <PhoneOutlined /> Contáctanos
          </Button>
        </Space>
      </div>
      

      {/* ✨ Estadísticas Destacadas */}
      <Row gutter={[24, 24]} className="section-spacing">
        {empresaInfo.estadisticas.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card hoverable className="stat-card elegant-shadow transition-effect">
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <div className="stat-icon-wrapper">
                  {renderIcon(stat.icono)}
                </div>
                <Statistic
                  title={<Text strong>{stat.titulo}</Text>}
                  value={stat.valor}
                  valueStyle={{ color: '#007bff', fontWeight: '800', fontSize: '2em' }}
                />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider orientation="left" className="divider-elegant">
        <Title level={2} className="section-title">Nuestra Empresa 🏢</Title>
      </Divider>

      {/* 🎯 Misión y Visión con Estilo */}
      <Row gutter={[24, 24]} className="section-spacing">
        <Col xs={24} lg={12}>
          <Card title={<Title level={3} className="card-title">Nuestra Misión</Title>} className="mision-card elegant-shadow transition-effect">
            <Paragraph className="card-paragraph">{empresaInfo.mision}</Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<Title level={3} className="card-title">Nuestra Visión</Title>} className="vision-card elegant-shadow transition-effect">
            <Paragraph className="card-paragraph">{empresaInfo.vision}</Paragraph>
          </Card>
        </Col>
      </Row>


      <Card
        title={<Title level={2} className="section-title" style={{ textAlign: 'center' }}>Nuestros Valores</Title>}
        className="valores-container elegant-shadow section-spacing"
      >
        <Row gutter={[24, 24]}>
          {empresaInfo.valores.map((valor, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <div className="valor-item transition-effect">
                <Text strong className="valor-text">{valor}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>


      <Divider orientation="center" className="divider-elegant">
        <Title level={2} className="section-title">Nuestros Servicios Destacados 🛠️</Title>
      </Divider>
      <Row gutter={[24, 24]} className="section-spacing">
        {empresaInfo.servicios.map((servicio, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card hoverable className="servicio-card elegant-shadow transition-effect">
              <div className="servicio-icon-wrapper">
                {renderIcon(servicio.icono)}
              </div>
              <Title level={4} className="servicio-title">{servicio.titulo}</Title>
              <Paragraph className="servicio-paragraph">{servicio.descripcion}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 📞 Contacto y Redes Sociales */}
      <Divider orientation="right" className="divider-elegant">
        <Title level={2} className="section-title">Hablemos 📧</Title>
      </Divider>
      <Card
        className="contact-card elegant-shadow section-spacing"
      >
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} md={12}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div className="contact-line">
                <PhoneOutlined className="contact-icon" />
                <Text strong className="contact-info">{empresaInfo.contacto.telefono}</Text>
              </div>
              <div className="contact-line">
                <MailOutlined className="contact-icon" />
                <Text strong className="contact-info">{empresaInfo.contacto.email}</Text>
              </div>
              <div className="contact-line">
                <HomeOutlined className="contact-icon" />
                <Text className="contact-info">{empresaInfo.contacto.direccion}</Text>
              </div>
              <div className="contact-line">
                <ClockCircleOutlined className="contact-icon" />
                <Text className="contact-info">{empresaInfo.contacto.horario}</Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default HomeView;