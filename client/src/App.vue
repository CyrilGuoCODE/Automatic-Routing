<template>
  <div class="app">
    <header>
      <nav>
        <router-link to="/">首页</router-link> |
        <router-link to="/dashboard">控制面板</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <p>© 2025 Automatic-Routing 智能域名路由系统</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background-color: #333;
  color: white;
  padding: 1rem;
}

nav {
  text-align: center;
}

nav a {
  color: white;
  text-decoration: none;
  margin: 0 10px;
}

nav a.router-link-active {
  font-weight: bold;
  border-bottom: 2px solid white;
}

main {
  flex: 1;
  padding: 2rem;
}

footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 1rem;
}
</style> 