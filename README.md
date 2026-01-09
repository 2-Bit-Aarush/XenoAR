# Xeno

Xeno is a **web-based 3D scanner and viewer application** built using **React + TypeScript**.  
The project focuses on **virtual scanning logic** and **GLB / 3D model processing and viewing**, structured in a clean and modular way.

---

## Features

- Modular React + TypeScript architecture
- Clear separation of concerns:
  - `components/` → UI and interaction logic
  - `services/` → scanning logic and 3D model handling
- GLB / 3D model viewing support
- Easy to extend for:
  - AR / VR features
  - Real-device scanning
  - Cloud storage and uploads

---

## Tech Stack

- React
- TypeScript
- HTML5
- WebGL / Three.js (if used for rendering)
- Vite or Create React App (depending on setup)

---

## Getting Started

### Install dependencies
- npm install 
### Run development server
- npm run dev 
or (if using CRA)
- npm start 
### Build for production
- npm run build 

---

## Architecture Overview

- **App.tsx**
  - Root component
  - Handles global layout and state

- **components/**
  - Scanner UI
  - Viewer controls
  - User interaction logic

- **services/**
  - Virtual scanning logic
  - GLB loading and rendering helpers

- **types.ts**
  - Shared interfaces and TypeScript types

---

## Future Improvements

- Real camera-based scanning
- ARCore / WebXR integration
- Export scanned models
- Cloud sync and storage
- Performance optimizations for large meshes

---

## License

This project is intended for learning and experimentation purposes.  
You are free to modify and extend it.

---

## Author

**Aarush Sharma**  
ECE Student | Exploring AR, 3D, and real-world applications