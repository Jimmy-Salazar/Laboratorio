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
      login: "Iniciar sesión",
      patient: "Paciente",
      patients: "Pacientes",
      administrator: "Administrador",
      languageLabel: "Idioma",
    },

    hero: {
      eyebrow: "TU SALUD, NUESTRA PRIORIDAD",
      titlePrefix: "Bienvenido a",
      brandName: "Laboratorio Clínico Dr. Chasi",
      description:
        "Estudios de laboratorio confiables, con tecnología de vanguardia y resultados digitales al alcance de tus manos.",
      primaryAction: "Ver resultados",
      secondaryAction: "Agendar un estudio",
      trustItems: [
        {
          title: "Resultados confiables",
          description: "Calidad y precisión",
        },
        {
          title: "Entrega en línea",
          description: "Rápida y segura",
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
          title: "Tecnología avanzada para resultados confiables",
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
          title: "Atención profesional en cada estudio",
        },
      ],
    },

    branches: {
      title: "Sucursales",
      subtitle: "Encuentra la sucursal más cercana",
      viewAll: "Ver todas las sucursales",
      items: [
        {
          id: "main-office",
          name: "Matriz Centro",
          address: "Dirección por definir",
          phone: "Teléfono por definir",
          hours: "Lun - Vie 7:00 a 19:00 · Sáb 7:00 a 14:00",
          image: "/images/branch-default.png",
        },
        {
          id: "branch-two",
          name: "Sucursal 2",
          address: "Dirección por definir",
          phone: "Teléfono por definir",
          hours: "Lun - Vie 7:00 a 19:00 · Sáb 7:00 a 14:00",
          image: "/images/branch-default.png",
        },
        {
          id: "branch-three",
          name: "Sucursal 3",
          address: "Dirección por definir",
          phone: "Teléfono por definir",
          hours: "Lun - Vie 7:00 a 19:00 · Sáb 8:00 a 14:00",
          image: "/images/branch-default.png",
        },
        {
          id: "branch-four",
          name: "Sucursal 4",
          address: "Dirección por definir",
          phone: "Teléfono por definir",
          hours: "Lun - Vie 7:00 a 19:00 · Sáb 7:00 a 14:00",
          image: "/images/branch-default.png",
        },
      ],
    },

    specialties: {
      title: "Especialidades",
      subtitle: "Amplia gama de estudios para el cuidado de tu salud",
      viewAll: "Ver todas las especialidades",
      items: [
        {
          id: "hematology",
          title: "Hematología",
          description:
            "Hemogramas, biometría hemática, reticulocitos y estudios hematológicos.",
          icon: "droplets",
        },
        {
          id: "clinical-chemistry",
          title: "Química Clínica",
          description:
            "Glucosa, lípidos, función renal, hepática, enzimas y perfiles metabólicos.",
          icon: "flask",
        },
        {
          id: "coagulation",
          title: "Coagulación y Hemostasia",
          description:
            "TP, TTP, INR, fibrinógeno y estudios de coagulación.",
          icon: "shield",
        },
        {
          id: "immunology",
          title: "Inmunología",
          description:
            "Anticuerpos, autoinmunidad, inmunoglobulinas y marcadores inmunológicos.",
          icon: "shield",
        },
        {
          id: "serology",
          title: "Serología",
          description:
            "Pruebas para detección de anticuerpos y enfermedades infecciosas.",
          icon: "flask",
        },
        {
          id: "microbiology",
          title: "Microbiología y Bacteriología",
          description:
            "Cultivos, antibiogramas e identificación de microorganismos.",
          icon: "microscope",
        },
        {
          id: "parasitology",
          title: "Parasitología",
          description:
            "Exámenes coproparasitarios y detección de parásitos.",
          icon: "microscope",
        },
        {
          id: "urinalysis",
          title: "Uroanálisis",
          description:
            "Examen general de orina, sedimento urinario y pruebas complementarias.",
          icon: "droplets",
        },
        {
          id: "endocrinology",
          title: "Hormonas y Endocrinología",
          description:
            "Tiroides, hormonas sexuales, cortisol, insulina y estudios endocrinos.",
          icon: "flask",
        },
        {
          id: "molecular-biology",
          title: "Biología Molecular",
          description:
            "PCR y otras técnicas moleculares para detección de agentes infecciosos.",
          icon: "microscope",
        },
        {
          id: "tumor-markers",
          title: "Marcadores Tumorales",
          description:
            "PSA, CEA, CA 125, CA 19-9, AFP y otros marcadores.",
          icon: "shield",
        },
        {
          id: "allergy",
          title: "Alergología",
          description:
            "IgE total, IgE específica y estudios relacionados con alergias.",
          icon: "shield",
        },
        {
          id: "toxicology",
          title: "Toxicología",
          description:
            "Detección y medición de sustancias, drogas y compuestos tóxicos.",
          icon: "flask",
        },
        {
          id: "fertility",
          title: "Fertilidad y Reproducción",
          description:
            "Hormonas reproductivas y pruebas relacionadas con fertilidad.",
          icon: "droplets",
        },
        {
          id: "immunohematology",
          title: "Inmunohematología",
          description:
            "Grupo sanguíneo, factor Rh, Coombs y estudios inmunohematológicos.",
          icon: "droplets",
        },
        {
          id: "therapeutic-drug-monitoring",
          title: "Monitoreo de Fármacos",
          description:
            "Determinación de niveles de medicamentos cuando el estudio esté disponible.",
          icon: "flask",
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
          title: "Detección Covid-19",
          image: "/images/promo-covid.png",
        },
      ],
    },

    results: {
      title: "Consulta y descarga tus resultados en línea",
      description:
        "Ingresa a tu portal de pacientes para ver y descargar tus resultados actuales e históricos en formato PDF, de manera segura, rápida y desde cualquier dispositivo.",
      features: [
        "Resultados actuales e históricos",
        "Descarga en PDF",
        "Acceso seguro 24/7",
      ],
      action: "Ingresar a mi portal",
    },

    footer: {
      contactTitle: "Contáctanos",
      phone: "Teléfono por definir",
      email: "correo@drchasi.com",
      address: "Dirección principal por definir",
      quickLinksTitle: "Enlaces rápidos",
      socialTitle: "Síguenos",
      slogan: "Tu salud nos inspira",
      privacy: "Aviso de privacidad",
      terms: "Términos y condiciones",
      rights: "Todos los derechos reservados.",
    },

    login: {
      back: "Volver al inicio",
      title: "Portal de acceso",
      description:
        "En el siguiente módulo conectaremos este formulario con la autenticación real.",
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
          hours: "Mon - Fri 7:00 to 19:00 · Sat 7:00 to 14:00",
          image: "/images/branch-default.png",
        },
        {
          id: "branch-two",
          name: "Location 2",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 · Sat 7:00 to 14:00",
          image: "/images/branch-default.png",
        },
        {
          id: "branch-three",
          name: "Location 3",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 · Sat 8:00 to 14:00",
          image: "/images/branch-default.png",
        },
        {
          id: "branch-four",
          name: "Location 4",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 · Sat 7:00 to 14:00",
          image: "/images/branch-default.png",
        },
      ],
    },

    specialties: {
      title: "Specialties",
      subtitle: "A broad range of laboratory studies for your health",
      viewAll: "View all specialties",
      items: [
        {
          id: "hematology",
          title: "Hematology",
          description:
            "Blood counts, reticulocytes and other hematological studies.",
          icon: "droplets",
        },
        {
          id: "clinical-chemistry",
          title: "Clinical Chemistry",
          description:
            "Glucose, lipids, kidney and liver function, enzymes and metabolic profiles.",
          icon: "flask",
        },
        {
          id: "coagulation",
          title: "Coagulation and Hemostasis",
          description:
            "PT, PTT, INR, fibrinogen and coagulation studies.",
          icon: "shield",
        },
        {
          id: "immunology",
          title: "Immunology",
          description:
            "Antibodies, autoimmunity, immunoglobulins and immune markers.",
          icon: "shield",
        },
        {
          id: "serology",
          title: "Serology",
          description:
            "Antibody testing and studies for infectious diseases.",
          icon: "flask",
        },
        {
          id: "microbiology",
          title: "Microbiology and Bacteriology",
          description:
            "Cultures, antimicrobial susceptibility and microorganism identification.",
          icon: "microscope",
        },
        {
          id: "parasitology",
          title: "Parasitology",
          description:
            "Stool studies and parasite detection.",
          icon: "microscope",
        },
        {
          id: "urinalysis",
          title: "Urinalysis",
          description:
            "Routine urinalysis, urine sediment and complementary studies.",
          icon: "droplets",
        },
        {
          id: "endocrinology",
          title: "Hormones and Endocrinology",
          description:
            "Thyroid, reproductive hormones, cortisol, insulin and endocrine studies.",
          icon: "flask",
        },
        {
          id: "molecular-biology",
          title: "Molecular Biology",
          description:
            "PCR and molecular techniques for infectious agent detection.",
          icon: "microscope",
        },
        {
          id: "tumor-markers",
          title: "Tumor Markers",
          description:
            "PSA, CEA, CA 125, CA 19-9, AFP and other markers.",
          icon: "shield",
        },
        {
          id: "allergy",
          title: "Allergy Testing",
          description:
            "Total IgE, specific IgE and allergy-related studies.",
          icon: "shield",
        },
        {
          id: "toxicology",
          title: "Toxicology",
          description:
            "Detection and measurement of drugs, substances and toxic compounds.",
          icon: "flask",
        },
        {
          id: "fertility",
          title: "Fertility and Reproduction",
          description:
            "Reproductive hormones and fertility-related testing.",
          icon: "droplets",
        },
        {
          id: "immunohematology",
          title: "Immunohematology",
          description:
            "Blood type, Rh factor, Coombs testing and related studies.",
          icon: "droplets",
        },
        {
          id: "therapeutic-drug-monitoring",
          title: "Therapeutic Drug Monitoring",
          description:
            "Measurement of medication levels when the study is available.",
          icon: "flask",
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



