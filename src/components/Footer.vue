<template>
  <footer class="app-footer">
    <div class="footer-content">
      <p>&copy; 2025 GesFincas - Gestión Inteligente de Comunidades</p>
      <div class="footer-links">
        <a href="#">Soporte</a>
        <a href="#">Privacidad</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  padding: 25px 30px;
  margin-top: 40px;
  border-top: 1px solid #e0e6ed;
  background: transparent;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #95a5a6;
  font-size: 0.85rem;
}

.footer-links { display: flex; gap: 20px; }
.footer-links a { text-decoration: none; color: #95a5a6; transition: 0.3s; }
.footer-links a:hover { color: #ff8c00; }

@media (max-width: 768px) {
  .footer-content { flex-direction: column; gap: 10px; text-align: center; }
}
</style>