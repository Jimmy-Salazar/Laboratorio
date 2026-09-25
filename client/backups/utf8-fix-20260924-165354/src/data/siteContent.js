/*
 * CONTENIDO CENTRAL DEL HOME
 * ---------------------------------------------------------------------------
 * Este archivo concentra los textos del Home en espanol e ingles.
 * Tambien define las rutas de las 5 imagenes del carrusel de Dr. Chasi.
 */

export const siteContent = {
  es: {
    navigation: {
      home: "Inicio",
      branches: "Sucursales",
      specialties: "Especialidades",
      promotions: "Promociones",
      results: "Resultados",
      login: "Iniciar sesiÃ³n",
      patient: "Paciente",
      patients: "Pacientes",
      administrator: "Administrador",
      languageLabel: "Idioma",
    },

    hero: {
      eyebrow: "TU SALUD, NUESTRA PRIORIDAD",
      titlePrefix: "Bienvenido a",
      brandName: "Laboratorio ClÃ­nico Dr. Chasi",
      description:
        "Estudios de laboratorio confiables, con tecnologÃ­a de vanguardia y resultados digitales al alcance de tus manos.",
      primaryAction: "Ver resultados",
      secondaryAction: "Agendar un estudio",
      trustItems: [
        {
          title: "Resultados confiables",
          description: "Calidad y precisiÃ³n",
        },
        {
          title: "Entrega en lÃ­nea",
          description: "RÃ¡pida y segura",
        },
        {
          title: "Personal especializado",
          description: "A tu servicio",
        },
      ],
      sideMessage: "Ciencia que cuida tu vida",
    },

    carousel: {
      slides: [
        {
          image: "/images/carousel-study-certainty.png",
          title: "Estudios que dan certeza a tu salud",
        },
        {
          image: "/images/carousel-advanced-technology.png",
          title: "TecnologÃ­a avanzada para resultados confiables",
        },
        {
          image: "/images/carousel-wellbeing.png",
          title: "Comprometidos con tu bienestar",
        },
        {
          image: "/images/carousel-precise-processes.png",
          title: "Procesos precisos para tu tranquilidad",
        },
        {
          image: "/images/carousel-professional-care.png",
          title: "AtenciÃ³n profesional en cada estudio",
        },
      ],
    },

    branches: {
      title: "Sucursales",
      subtitle: "Encuentra la sucursal mÃ¡s cercana",
      viewAll: "Ver todas las sucursales",
      items: [
        {
          id: "main-office",
          name: "Matriz Centro",
          address: "DirecciÃ³n por definir",
          phone: "TelÃ©fono por definir",
          hours: "Lun - Vie 7:00 a 19:00 Â· SÃ¡b 7:00 a 14:00",
          image: "/images/branch-1.png",
        },
        {
          id: "branch-two",
          name: "Sucursal 2",
          address: "DirecciÃ³n por definir",
          phone: "TelÃ©fono por definir",
          hours: "Lun - Vie 7:00 a 19:00 Â· SÃ¡b 7:00 a 14:00",
          image: "/images/branch-2.png",
        },
        {
          id: "branch-three",
          name: "Sucursal 3",
          address: "DirecciÃ³n por definir",
          phone: "TelÃ©fono por definir",
          hours: "Lun - Vie 7:00 a 19:00 Â· SÃ¡b 8:00 a 14:00",
          image: "/images/branch-3.png",
        },
        {
          id: "branch-four",
          name: "Sucursal 4",
          address: "DirecciÃ³n por definir",
          phone: "TelÃ©fono por definir",
          hours: "Lun - Vie 7:00 a 19:00 Â· SÃ¡b 7:00 a 14:00",
          image: "/images/branch-4.png",
        },
      ],
    },

    specialties: {
      title: "Especialidades",
      subtitle: "Amplia gama de estudios para tu salud",
      viewAll: "Ver todas las especialidades",
      items: [
        {
          id: "hematology",
          title: "HematologÃ­a",
          description: "BiometrÃ­a, coagulaciÃ³n y mÃ¡s.",
          icon: "droplets",
        },
        {
          id: "clinical-chemistry",
          title: "QuÃ­mica ClÃ­nica",
          description: "Metabolismo, enzimas y perfiles.",
          icon: "flask",
        },
        {
          id: "microbiology",
          title: "MicrobiologÃ­a",
          description: "Cultivos, serologÃ­as y detecciÃ³n de patÃ³genos.",
          icon: "microscope",
        },
        {
          id: "immunology",
          title: "InmunologÃ­a",
          description: "Alergias, autoinmunidad y marcadores.",
          icon: "shield",
        },
        {
          id: "respiratory",
          title: "Covid / Respiratorio",
          description: "PCR, antÃ­genos y paneles respiratorios.",
          icon: "lungs",
        },
      ],
    },

    promotions: {
      title: "Promociones",
      subtitle: "Cuida tu salud con estudios y paquetes especiales",
      viewAll: "Ver todas las promociones",
      items: [
        {
          id: "checkup",
          title: "Check Up General",
          image: "/images/promo-checkup.png",
        },
        {
          id: "women-profile",
          title: "Perfil de la Mujer",
          image: "/images/promo-women.png",
        },
        {
          id: "men-profile",
          title: "Perfil del Hombre",
          image: "/images/promo-men.png",
        },
        {
          id: "covid",
          title: "DetecciÃ³n Covid-19",
          image: "/images/promo-covid.png",
        },
      ],
    },

    results: {
      title: "Consulta y descarga tus resultados en lÃ­nea",
      description:
        "Ingresa a tu portal de pacientes para ver y descargar tus resultados actuales e histÃ³ricos en formato PDF, de manera segura, rÃ¡pida y desde cualquier dispositivo.",
      features: [
        "Resultados actuales e histÃ³ricos",
        "Descarga en PDF",
        "Acceso seguro 24/7",
      ],
      action: "Ingresar a mi portal",
    },

    footer: {
      contactTitle: "ContÃ¡ctanos",
      phone: "TelÃ©fono por definir",
      email: "correo@drchasi.com",
      address: "DirecciÃ³n principal por definir",
      quickLinksTitle: "Enlaces rÃ¡pidos",
      socialTitle: "SÃ­guenos",
      slogan: "Tu salud nos inspira",
      privacy: "Aviso de privacidad",
      terms: "TÃ©rminos y condiciones",
      rights: "Todos los derechos reservados.",
    },

    login: {
      back: "Volver al inicio",
      title: "Portal de acceso",
      description:
        "En el siguiente mÃ³dulo conectaremos este formulario con la autenticaciÃ³n real.",
      patient: "Paciente",
      administrator: "Administrador",
    },
  },

  en: {
    navigation: {
      home: "Home",
      branches: "Locations",
      specialties: "Specialties",
      promotions: "Promotions",
      results: "Results",
      login: "Sign in",
      patient: "Patient",
      patients: "Patients",
      administrator: "Administrator",
      languageLabel: "Language",
    },

    hero: {
      eyebrow: "YOUR HEALTH, OUR PRIORITY",
      titlePrefix: "Welcome to",
      brandName: "Dr. Chasi Clinical Laboratory",
      description:
        "Reliable laboratory testing, advanced technology and digital results available at your fingertips.",
      primaryAction: "View results",
      secondaryAction: "Schedule a study",
      trustItems: [
        {
          title: "Reliable results",
          description: "Quality and precision",
        },
        {
          title: "Online delivery",
          description: "Fast and secure",
        },
        {
          title: "Specialized staff",
          description: "At your service",
        },
      ],
      sideMessage: "Science that cares for your life",
    },

    carousel: {
      slides: [
        {
          image: "/images/carousel-study-certainty.png",
          title: "Studies that bring certainty to your health",
        },
        {
          image: "/images/carousel-advanced-technology.png",
          title: "Advanced technology for reliable results",
        },
        {
          image: "/images/carousel-wellbeing.png",
          title: "Committed to your wellbeing",
        },
        {
          image: "/images/carousel-precise-processes.png",
          title: "Precise processes for your peace of mind",
        },
        {
          image: "/images/carousel-professional-care.png",
          title: "Professional care in every study",
        },
      ],
    },

    branches: {
      title: "Locations",
      subtitle: "Find the nearest laboratory location",
      viewAll: "View all locations",
      items: [
        {
          id: "main-office",
          name: "Main Office",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 Â· Sat 7:00 to 14:00",
          image: "/images/branch-1.png",
        },
        {
          id: "branch-two",
          name: "Location 2",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 Â· Sat 7:00 to 14:00",
          image: "/images/branch-2.png",
        },
        {
          id: "branch-three",
          name: "Location 3",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 Â· Sat 8:00 to 14:00",
          image: "/images/branch-3.png",
        },
        {
          id: "branch-four",
          name: "Location 4",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 Â· Sat 7:00 to 14:00",
          image: "/images/branch-4.png",
        },
      ],
    },

    specialties: {
      title: "Specialties",
      subtitle: "A broad range of studies for your health",
      viewAll: "View all specialties",
      items: [
        {
          id: "hematology",
          title: "Hematology",
          description: "Blood count, coagulation and more.",
          icon: "droplets",
        },
        {
          id: "clinical-chemistry",
          title: "Clinical Chemistry",
          description: "Metabolism, enzymes and profiles.",
          icon: "flask",
        },
        {
          id: "microbiology",
          title: "Microbiology",
          description: "Cultures, serology and pathogen detection.",
          icon: "microscope",
        },
        {
          id: "immunology",
          title: "Immunology",
          description: "Allergies, autoimmunity and markers.",
          icon: "shield",
        },
        {
          id: "respiratory",
          title: "Covid / Respiratory",
          description: "PCR, antigen and respiratory panels.",
          icon: "lungs",
        },
      ],
    },

    promotions: {
      title: "Promotions",
      subtitle: "Take care of your health with special studies and packages",
      viewAll: "View all promotions",
      items: [
        {
          id: "checkup",
          title: "General Check Up",
          image: "/images/promo-checkup.png",
        },
        {
          id: "women-profile",
          title: "Women's Profile",
          image: "/images/promo-women.png",
        },
        {
          id: "men-profile",
          title: "Men's Profile",
          image: "/images/promo-men.png",
        },
        {
          id: "covid",
          title: "Covid-19 Detection",
          image: "/images/promo-covid.png",
        },
      ],
    },

    results: {
      title: "View and download your results online",
      description:
        "Sign in to your patient portal to view and download current and historical PDF results securely, quickly and from any device.",
      features: [
        "Current and historical results",
        "PDF download",
        "Secure access 24/7",
      ],
      action: "Open my portal",
    },

    footer: {
      contactTitle: "Contact us",
      phone: "Phone to be defined",
      email: "email@drchasi.com",
      address: "Main address to be defined",
      quickLinksTitle: "Quick links",
      socialTitle: "Follow us",
      slogan: "Your health inspires us",
      privacy: "Privacy notice",
      terms: "Terms and conditions",
      rights: "All rights reserved.",
    },

    login: {
      back: "Back to home",
      title: "Access portal",
      description:
        "In the next module this form will be connected to real authentication.",
      patient: "Patient",
      administrator: "Administrator",
    },
  },
};



