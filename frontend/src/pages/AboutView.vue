<template>
  <div class="card max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">About JomBarter</h1>

    <div class="prose max-w-none">
      <p class="text-lg text-gray-700 mb-6">
        JomBarter is a community marketplace designed to facilitate the exchange of goods and
        services without the traditional use of money. Our platform connects people who have items
        or skills they'd like to trade with others who need them.
      </p>

      <h2 class="text-2xl font-semibold mb-4">How It Works</h2>
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 class="text-lg font-medium mb-3">For Traders</h3>
          <ol class="list-decimal list-inside space-y-2 text-gray-700">
            <li>Create your account and profile</li>
            <li>List items or services you want to trade</li>
            <li>Browse what others are offering</li>
            <li>Make trade offers</li>
            <li>Negotiate through our messaging system</li>
            <li>Complete the exchange</li>
            <li>Leave reviews to build trust</li>
          </ol>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-3">Safety Features</h3>
          <ul class="list-disc list-inside space-y-2 text-gray-700">
            <li>User verification system</li>
            <li>Secure messaging platform</li>
            <li>Rating and review system</li>
            <li>Trade history tracking</li>
            <li>Report system for inappropriate content</li>
            <li>Admin moderation</li>
          </ul>
        </div>
      </div>

      <h2 class="text-2xl font-semibold mb-4">Technology Stack</h2>
      <div class="bg-surface-100 p-4 rounded-lg mb-6 border border-surface-200">
        <div class="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 class="font-medium mb-2">Frontend</h4>
            <ul class="space-y-1 text-gray-600">
              <li>Vue 3 + Vite</li>
              <li>Tailwind CSS + Flowbite</li>
              <li>Pinia (State Management)</li>
              <li>Vue Router</li>
              <li>Axios (HTTP Client)</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium mb-2">Backend</h4>
            <ul class="space-y-1 text-gray-600">
              <li>NestJS + TypeScript</li>
              <li>Microsoft SQL Server</li>
              <li>Prisma ORM</li>
              <li>JWT Authentication</li>
              <li>Socket.IO for Real-time</li>
            </ul>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-semibold mb-4">Development Status</h2>
      <p class="text-gray-700">
        This project is currently in development following an incremental MVP approach. Phase 1
        (Project Setup) has been completed, establishing the foundation for the frontend and backend
        architecture.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// About page component
</script>
