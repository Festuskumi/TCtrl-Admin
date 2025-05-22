# TCTRL Fashion E-Commerce Admin Dashboard


---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Available Scripts](#-available-scripts)
- [Pages & Components](#-pages--components)
- [Authentication](#-authentication)
- [API Integration](#-api-integration)
- [Deployment](#-deployment)
- [Contact](#-contact)

---

## 🚀 Overview

TCTRL Admin Dashboard is a dedicated administrative interface for the TCTRL Fashion E-Commerce platform. Built with React and Vite, it provides comprehensive tools for managing products, orders, customers, and business analytics.

This dashboard enables administrators to efficiently handle day-to-day operations of the e-commerce store, including inventory management, order processing, and content administration.

---

## ✨ Features

### Dashboard & Analytics
- Summary statistics and KPIs
- Sales trends and performance charts
- Inventory status overview
- Recent orders and activities

### Product Management
- Add, edit, and delete products
- Manage product categories and collections
- Upload and organize product images
- Set pricing, inventory, and product variations

### Order Management
- View and process orders
- Update order status
- Generate invoices
- Manage shipping and delivery

### User Management
- Customer account administration
- Admin user role management
- Permission settings

### Content Management
- Update homepage featured content
- Manage promotional banners
- Edit static pages

### System Settings
- Store configuration
- Payment gateway settings
- Email notification templates
- Security settings

---

## 📦 Tech Stack

### Core
- **React** - UI library
- **Vite** - Build tool and development server
- **React Router** - Client-side routing

### State Management
- **React Context API** - Global state management
- **useReducer** - Complex state logic

### UI Components
- **Custom UI Components** - Sidebar, navigation, tables
- **Charts and Data Visualization** - For analytics

### Development Tools
- **ESLint** - Code linting
- **Babel** - JavaScript compiler
- **SWC** - Fast refresh and compilation

### API Communication
- **Fetch API** - Data fetching
- **Axios** (Optional) - HTTP client

---

## 🏗️ Project Structure

```
tctrl-admin/
├── public/              # Static files
├── src/                 # Source files
│   ├── assets/          # Images, icons, and static assets
│   │
│   ├── components/      # Reusable React components
│   │   ├── LoginAdmin.jsx  # Admin login component
│   │   ├── Navbar.jsx      # Top navigation bar
│   │   └── SideBarApp.jsx  # Sidebar navigation
│   │
│   ├── Pages/           # Admin page components
│   │   ├── AddProducts.jsx # Add new products page
│   │   ├── ListProducts.jsx # Product listing page
│   │   └── Ordered.jsx     # Order management page
│   │
│   ├── App.jsx          # Main application component
│   ├── index.css        # Global styles
│   └── main.jsx         # Application entry point
│
├── .env                 # Environment variables
├── .eslintrc.js         # ESLint configuration
├── .gitignore           # Git ignore file
├── index.html           # HTML entry point
├── package.json         # Project dependencies
├── package-lock.json    # Dependency lock file
├── README.md            # Project documentation
├── vite.config.js       # Vite configuration
└── vercel.json          # Vercel deployment configuration
```

---

## 🔧 Installation

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Backend API running (see [Backend Repository](https://github.com/festuskumi/tctrl-backend))

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/festuskumi/tctrl-admin.git
   cd tctrl-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory (see Environment Configuration section)

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The admin dashboard will be available at `http://localhost:5173`.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# API URL - Connect to backend
VITE_BACKEND_URL=http://localhost:4000
```

**Important Security Notes:**
- Never commit your `.env` file to version control
- Admin dashboard should always be deployed with secure HTTPS
- Consider implementing IP restrictions for production admin access

---

## 📜 Available Scripts

In the project directory, you can run:

### `npm run dev` or `yarn dev`
Runs the app in development mode with hot-reloading.

### `npm run build` or `yarn build`
Builds the app for production to the `dist` folder.

### `npm run preview` or `yarn preview`
Previews the production build locally.

### `npm run lint` or `yarn lint`
Runs ESLint to check for code quality issues.

---

## 📄 Pages & Components

### Core Components

#### `LoginAdmin.jsx`
Admin authentication component with secure login form.

#### `Navbar.jsx`
Top navigation bar with user profile, notifications, and quick actions.

#### `SideBarApp.jsx`
Sidebar navigation component with links to all admin sections.

### Main Pages

#### `AddProducts.jsx`
Form interface for adding new products to the store, including:
- Product details (name, description, price)
- Category selection
- Image uploads
- Inventory management
- SEO settings

#### `ListProducts.jsx`
Comprehensive product management page with:
- Sortable and filterable product table
- Quick edit functionality
- Bulk actions
- Product status toggling
- Delete confirmation

#### `Ordered.jsx`
Order management interface featuring:
- Order listing with status
- Order details view
- Status update functionality
- Customer information
- Payment details
- Shipping tracking

---

## 🔐 Authentication

The admin dashboard implements secure authentication:

1. **Login Process**:
   - Admin credentials validated against backend
   - JWT token stored for authenticated requests
   - Session management and timeout

2. **Security Measures**:
   - CSRF protection
   - Role-based access control
   - Secure password policies
   - Activity logging

3. **Implementation**:
   ```jsx
   // Example authentication context usage
   import { useContext } from 'react';
   import { AuthContext } from '../context/AuthContext';

   function ProtectedComponent() {
     const { isAuthenticated, user, logout } = useContext(AuthContext);
     
     if (!isAuthenticated) {
       return <Redirect to="/login" />;
     }
     
     return (
       <div>
         <h1>Welcome, {user.name}</h1>
         <button onClick={logout}>Logout</button>
       </div>
     );
   }
   ```

---

## 🔌 API Integration

The admin dashboard communicates with the backend API:

### Authentication Endpoints
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile

### Product Management
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Order Management
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/:id` - Get order details
- `PUT /api/admin/orders/:id` - Update order status

### Example API Request
```javascript
// Example of adding a new product
async function addProduct(productData) {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to add product');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}
```

---

## 🚢 Deployment

### Vercel Deployment

The project includes a `vercel.json` configuration file for easy deployment to Vercel:

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

### Production Considerations

When deploying the admin dashboard to production:

1. **Security**:
   - Enable HTTPS
   - Consider IP restrictions
   - Implement rate limiting
   - Use environment-specific variables

2. **Performance**:
   - Enable build optimization
   - Implement code splitting
   - Configure proper caching

3. **Monitoring**:
   - Set up error tracking
   - Implement usage analytics
   - Monitor API performance

---

## 📞 Contact

**Project Lead**: Festus Kumi  
**Email**: festuskumi8@gmail.com  
**GitHub**: [@festuskumi](https://github.com/festuskumi)

For bug reports, feature requests, or general inquiries, please create an issue in the GitHub repository.

---

<div align="center">
  <sub>Built with ❤️ by the TCTRL Team</sub>
</div>