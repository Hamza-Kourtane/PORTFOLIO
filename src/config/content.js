/*
 * Portfolio content shown in the panels.
 * Starting data was taken from the reference site (raomuhammadhamza.tech).
 * Edit freely — ids are referenced by the clickable objects in the room.
 */

/*
 * Projects — shown on the laptop (full screen) when you click the PC.
 * Built from the GitHub repos (github.com/Hamza-Kourtane) and your own description.
 */
export const PROJECTS = [
  {
    id: 'soremed',
    group: 'Work',
    status: 'B2B ordering platform',
    url: 'soremed · espace pharmacien',
    icon: 'pill',
    preview: { images: ['/projects/soremed-home.jpg', '/projects/soremed-admin.jpg', '/projects/soremed-product.jpg'], captions: ['Pharmacist home — offers and the medicine catalogue', 'Admin dashboard — orders by city, on a map of Morocco and by channel', 'Product page — price, stock and add to cart'] },
    name: 'SOREMED Pharma Orders',
    short: 'Soremed',
    tagline: 'A private ordering website for pharmacists',
    context: 'Soremed · Internship',
    color: '#c0392b',
    body: 'Pharmacists log in to a private space, search the medicine catalogue, fill a cart and send their order to Soremed. The Soremed team follows every order from a live dashboard — by status, by city and on a map of Morocco.',
    features: [
      'Pharmacy accounts: sign-up with company name, city and phone, then login',
      'Medicine search, product pages and similar-product suggestions',
      'Cart with order summary and one-click ordering',
      'Order tracking: pending, in preparation, shipped, delivered, cancelled',
      'Admin dashboard: stats for today / 7 / 30 days, orders by city, order-channel chart',
      'Interactive map of orders across Morocco (Leaflet)',
      'Order details, status updates, printable orders, CSV export, new-order alerts',
    ],
    stack: ['React', 'PHP', 'JavaScript', 'HTML / CSS', 'Tailwind CSS', 'Leaflet'],
    link: 'https://github.com/Hamza-Kourtane/soremed',
  },
  {
    id: 'nfc-restaurant',
    group: 'Freelance',
    status: 'Client project',
    url: 'restaurant menu · table 12',
    icon: 'nfc',
    preview: { mock: 'nfc' },
    name: 'NFC Restaurant Ordering',
    short: 'NFC Orders',
    tagline: 'Tap the table card, order from your phone',
    context: 'Freelance',
    color: '#e67e22',
    body: 'Each table has an NFC card. A guest taps it with their phone, the restaurant menu opens straight away, and the order goes to the kitchen — no app to install and no waiting for the waiter.',
    features: [
      'NFC card on each table opens the menu on the guest’s phone',
      'The table is recognised automatically from the card',
      'Browse the menu and send the order from the phone',
      'Orders arrive on the restaurant side for preparation',
    ],
    stack: ['NFC', 'Web app', 'Mobile-first'],
  },
  {
    id: 'posters',
    group: 'Freelance',
    status: 'Client project',
    url: 'ajitba3 · posters for your walls',
    icon: 'frame',
    preview: { images: ['/projects/posters-home.jpg', '/projects/posters-shop.jpg', '/projects/posters-product.jpg', '/projects/posters-custom.jpg'], captions: ['Home — “Your walls deserve more”', 'Shop — posters by category: cars, anime, football, UFC', 'Product page — poster only or with frame, bulk savings', 'Custom poster — upload your own image'] },
    name: 'AJITBA3 — Poster Shop',
    short: 'AJITBA3',
    tagline: 'An online poster shop for Morocco',
    context: 'Freelance',
    color: '#8e44ad',
    body: 'A full-stack shop for selling posters in Morocco: a catalogue with bestsellers and new arrivals, a cart with framed or unframed options, cash-on-delivery checkout, and an admin dashboard to manage products and orders.',
    features: [
      'Product catalogue with bestsellers and latest products',
      'Cart with frame / no-frame options and bulk savings',
      'Custom posters from the customer’s own image',
      'Cash-on-delivery checkout',
      'Admin dashboard for products and orders',
    ],
    stack: ['Next.js 14', 'React', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB Atlas'],
    link: 'https://github.com/Hamza-Kourtane/AJITBA3',
  },
  {
    id: 'booking-doctor',
    group: 'Studies',
    status: 'Healthcare platform',
    url: 'doctori · find and book doctors',
    icon: 'doctor',
    preview: { images: ['/projects/doctori-home.jpg'], captions: ['Home — search by specialty and location, 24/7 booking'] },
    name: 'Doctori — Doctor Booking',
    short: 'Doctori',
    tagline: 'Find a doctor, book an appointment, ask the AI assistant',
    context: 'Final-year project (PFE)',
    color: '#16a085',
    body: 'Patients search doctors, open their profile and book an appointment; doctors register, get verified and manage their bookings from their own dashboard. An AI chatbot helps patients find their way.',
    features: [
      'Search doctors by specialty and location',
      'Doctor list and detailed doctor profiles',
      'Appointment booking and “My appointments” for patients',
      'Doctor registration, verification and dashboard',
      'Secure accounts (JWT + hashed passwords) and file uploads',
      'AI chatbot powered by Google Gemini',
    ],
    stack: ['React', 'TypeScript', 'Vite', 'Node.js', 'Express', 'PostgreSQL', 'JWT', 'Gemini API'],
    link: 'https://github.com/Hamza-Kourtane/pfe',
  },
  {
    id: 'odoo',
    group: 'Work',
    status: 'In progress',
    url: 'odoo · smartwayafrica client',
    icon: 'grid',
    preview: { mock: 'odoo' },
    name: 'Odoo Business Modules',
    short: 'Odoo',
    tagline: 'Custom ERP modules for SmartWayAfrica clients',
    context: 'SmartWayAfrica · Current',
    color: '#714b67',
    body: 'Building and customising Odoo for client companies: new modules, adapted screens and reports, and standard apps configured around the way each client works.',
    features: [
      'Custom modules with the Odoo ORM',
      'Forms, lists and PDF reports in XML / QWeb',
      'Sales, Inventory, Accounting and CRM configuration',
      'Data imports and support after go-live',
    ],
    stack: ['Odoo', 'Python', 'XML / QWeb', 'JavaScript (OWL)', 'PostgreSQL'],
  },
  {
    id: 'portfolio',
    group: 'Personal',
    status: 'You are here',
    url: 'hamza kourtane’s room',
    icon: 'cube',
    preview: { images: ['/projects/portfolio-room.jpg'], captions: ['The room you are standing in'] },
    name: 'This 3D Portfolio',
    short: 'Portfolio',
    tagline: 'A Moroccan room you can walk into',
    context: 'Personal project',
    color: '#d4a850',
    body: 'The room you are in: modelled entirely in code, with carved lattices, a working robot, a cat that purrs, and books that fly off the shelf.',
    features: ['All 3D objects built in code — no model files', 'Real-time lights, soft shadows and fur', 'Camera flights between places'],
    stack: ['React', 'Three.js', 'React Three Fiber', 'Vite'],
  },
]

/*
 * Experience — one book per job on the right bookshelf (top shelf).
 */
export const EXPERIENCE = [
  {
    id: 'exp-smartway',
    company: 'SmartWayAfrica',
    role: 'Odoo Developer',
    period: 'Present',
    duration: 'Current role',
    type: 'Full-time',
    location: 'Morocco',
    color: '#1e4d3a',
    summary:
      'SmartWayAfrica builds business software on Odoo, the open-source ERP. I turn how a company actually works — sales, stock, invoicing, approvals — into Odoo modules and configurations that teams use every day.',
    tasks: [
      'Develop custom Odoo modules in Python with the Odoo ORM',
      'Build and adapt forms, list views and PDF reports in XML / QWeb',
      'Add interface behaviour in JavaScript with Odoo’s OWL framework',
      'Configure Sales, Inventory, Accounting and CRM around client processes',
      'Import client data and support users after go-live',
    ],
    stack: ['Odoo', 'Python', 'XML / QWeb', 'JavaScript (OWL)', 'PostgreSQL', 'Git'],
    takeaway: 'Software is only finished when the team using it every day is happy with it.',
  },
  {
    id: 'exp-freelance',
    company: 'Freelance',
    role: 'Freelance Web Developer',
    period: 'Independent work',
    duration: 'Project based',
    type: 'Freelance',
    location: 'Morocco · Remote',
    color: '#1b2a41',
    summary:
      'Projects for my own clients, from the first conversation to delivery: an online shop, and an ordering system for restaurants where guests tap an NFC card on the table and order from their phone.',
    tasks: [
      'NFC restaurant ordering — tap the table card, the menu opens on the phone, the order goes to the restaurant',
      'Poster e-commerce for Morocco — catalogue, cart with frame options, cash-on-delivery checkout',
      'Admin dashboards so clients manage their own products and orders',
      'Talk with clients, agree on scope, deliver and keep improving after launch',
    ],
    stack: ['Next.js', 'React', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB', 'NFC'],
    takeaway: 'Owning a project end to end — from the first call to the final delivery.',
  },
  {
    id: 'exp-soremed',
    company: 'Soremed',
    role: 'Web Developer · Internship',
    period: 'Across two years',
    duration: '8 months in total',
    type: 'Pharmaceutical distribution',
    location: 'Morocco',
    color: '#8b1e24',
    summary:
      'Soremed is one of the largest pharmaceutical distributors in Morocco, supplying medicines to pharmacies across the country. Over 8 months, split across two years, I built a private website where pharmacists order directly from Soremed.',
    tasks: [
      'Private pharmacist space: account sign-up, login and a welcome screen',
      'Medicine catalogue with search, product pages and similar products',
      'Cart and ordering, with order status from pending to delivered',
      'Admin dashboard: daily / 7-day / 30-day stats, orders by city, live map of Morocco',
      'Order management: details, status updates, printing and CSV export',
    ],
    stack: ['React', 'PHP', 'JavaScript', 'Tailwind CSS', 'Leaflet'],
    takeaway: 'Building a real tool for a big company, where every order has to be right.',
  },
]

export const ABOUT = {
  id: 'about-bio',
  title: 'About me',
  body: [
    'I build production-ready generative AI, coming from a background in data analysis.',
    'My focus is RAG, LLM orchestration and getting models deployed and useful.',
    'Off the clock: tea, books, and my cat Kai.',
  ],
  skills: {
    Languages: ['Python', 'SQL', 'TypeScript', 'R', 'C/C++'],
    Tools: ['LangChain', 'LlamaIndex', 'Qdrant'],
  },
}

export const CONTACT = {
  id: 'contact',
  links: [
    { label: 'GitHub', href: 'https://github.com/illeniall239' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rao-muhammad-hamza/' },
    { label: 'Awwwards', href: 'https://www.awwwards.com/sites/hamzas-desk' },
  ],
}
