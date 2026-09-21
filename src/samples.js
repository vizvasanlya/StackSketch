/**
 * Built-in benchmark sample architecture reports for interactive exploration.
 */

const SAMPLE_PROJECTS = {
  "nextjs-fullstack": {
    title: "VibeTrack · Full-Stack Next.js 15 & Prisma",
    generatedAt: "2026-09-20T18:30:00.000Z",
    summary: {
      totalFiles: 38,
      sourceFiles: 32,
      scannedFiles: 32,
      maxFiles: 500,
      maxFilesReached: false,
      totalLines: 4820,
      totalCodeLines: 3960,
      totalBlankLines: 540,
      totalCommentLines: 320,
      totalBytes: 154200,
      importEdges: 58,
      externalDependencies: 14,
      languages: 4,
      frameworks: 4
    },
    stack: {
      languages: [
        { name: "TypeScript", files: 24, lines: 3420, bytes: 112000, percent: 71 },
        { name: "CSS", files: 4, lines: 680, bytes: 24200, percent: 14 },
        { name: "SQL", files: 2, lines: 420, bytes: 12000, percent: 9 },
        { name: "JSON", files: 2, lines: 300, bytes: 6000, percent: 6 }
      ],
      frameworks: ["Next.js", "React", "Tailwind CSS", "Prisma"]
    },
    config: { maxFiles: 500 },
    humanSummary: {
      size: "154.2 KB",
      lines: "3,960",
      physicalLines: "4,820",
      files: "38",
      sourceFiles: "32",
      edges: "58",
      dependencies: "14"
    },
    directoryTree: {
      name: ".",
      type: "directory",
      children: [
        {
          name: "app",
          type: "directory",
          children: [
            { name: "layout.tsx", type: "file", path: "app/layout.tsx" },
            { name: "page.tsx", type: "file", path: "app/page.tsx" },
            { name: "dashboard", type: "directory", children: [{ name: "page.tsx", type: "file", path: "app/dashboard/page.tsx" }] },
            {
              name: "api",
              type: "directory",
              children: [
                { name: "auth.ts", type: "file", path: "app/api/auth.ts" },
                { name: "tracks.ts", type: "file", path: "app/api/tracks.ts" },
                { name: "analytics.ts", type: "file", path: "app/api/analytics.ts" }
              ]
            }
          ]
        },
        {
          name: "components",
          type: "directory",
          children: [
            { name: "Header.tsx", type: "file", path: "components/Header.tsx" },
            { name: "Player.tsx", type: "file", path: "components/Player.tsx" },
            { name: "MetricsCard.tsx", type: "file", path: "components/MetricsCard.tsx" },
            { name: "TrackList.tsx", type: "file", path: "components/TrackList.tsx" }
          ]
        },
        {
          name: "lib",
          type: "directory",
          children: [
            { name: "db.ts", type: "file", path: "lib/db.ts" },
            { name: "auth.ts", type: "file", path: "lib/auth.ts" },
            { name: "spotify.ts", type: "file", path: "lib/spotify.ts" },
            { name: "utils.ts", type: "file", path: "lib/utils.ts" }
          ]
        },
        {
          name: "prisma",
          type: "directory",
          children: [
            { name: "schema.prisma", type: "file", path: "prisma/schema.prisma" }
          ]
        }
      ]
    },
    topFiles: [
      { path: "lib/spotify.ts", language: "TypeScript", loc: 412, imports: ["@spotify/web-api", "axios", "./db"], exports: ["getSpotifyClient", "fetchPlaylist", "refreshUserToken"] },
      { path: "components/Player.tsx", language: "TypeScript", loc: 368, imports: ["react", "@/lib/spotify", "@/components/TrackList"], exports: ["AudioPlayer", "usePlayerState"] },
      { path: "app/dashboard/page.tsx", language: "TypeScript", loc: 310, imports: ["react", "@/components/Header", "@/components/MetricsCard", "@/lib/db"], exports: ["DashboardPage"] },
      { path: "lib/db.ts", language: "TypeScript", loc: 280, imports: ["@prisma/client"], exports: ["prisma", "disconnectDb", "withTransaction"] },
      { path: "lib/auth.ts", language: "TypeScript", loc: 260, imports: ["jsonwebtoken", "bcryptjs", "./db"], exports: ["verifySession", "hashPassword", "signJwtToken"] },
      { path: "app/api/tracks.ts", language: "TypeScript", loc: 240, imports: ["next/server", "@/lib/spotify", "@/lib/db"], exports: ["GET", "POST"] }
    ],
    graph: {
      nodes: [
        { id: "app/layout.tsx", path: "app/layout.tsx", name: "layout.tsx", language: "TypeScript", loc: 94, lines: 110, blankLines: 10, commentLines: 6, bytes: 3400, imports: ["react", "@/components/Header", "globals.css"], exports: ["RootLayout"], score: 25, external: false },
        { id: "app/page.tsx", path: "app/page.tsx", name: "page.tsx", language: "TypeScript", loc: 140, lines: 165, blankLines: 15, commentLines: 10, bytes: 4800, imports: ["react", "@/components/Header", "next/link"], exports: ["HomePage"], score: 30, external: false },
        { id: "app/dashboard/page.tsx", path: "app/dashboard/page.tsx", name: "dashboard/page.tsx", language: "TypeScript", loc: 310, lines: 360, blankLines: 30, commentLines: 20, bytes: 11200, imports: ["react", "@/components/Header", "@/components/MetricsCard", "@/components/TrackList", "@/lib/db"], exports: ["DashboardPage"], score: 65, external: false },
        { id: "app/api/auth.ts", path: "app/api/auth.ts", name: "api/auth.ts", language: "TypeScript", loc: 180, lines: 210, blankLines: 18, commentLines: 12, bytes: 6400, imports: ["next/server", "@/lib/auth", "@/lib/db"], exports: ["POST"], score: 45, external: false },
        { id: "app/api/tracks.ts", path: "app/api/tracks.ts", name: "api/tracks.ts", language: "TypeScript", loc: 240, lines: 280, blankLines: 25, commentLines: 15, bytes: 8600, imports: ["next/server", "@/lib/spotify", "@/lib/db"], exports: ["GET", "POST"], score: 55, external: false },
        { id: "app/api/analytics.ts", path: "app/api/analytics.ts", name: "api/analytics.ts", language: "TypeScript", loc: 195, lines: 230, blankLines: 20, commentLines: 15, bytes: 7100, imports: ["next/server", "@/lib/db"], exports: ["GET"], score: 40, external: false },
        { id: "components/Header.tsx", path: "components/Header.tsx", name: "Header.tsx", language: "TypeScript", loc: 130, lines: 150, blankLines: 12, commentLines: 8, bytes: 4600, imports: ["react", "next/link", "lucide-react"], exports: ["Header"], score: 35, external: false },
        { id: "components/Player.tsx", path: "components/Player.tsx", name: "Player.tsx", language: "TypeScript", loc: 368, lines: 420, blankLines: 32, commentLines: 20, bytes: 13400, imports: ["react", "@/lib/spotify", "@/components/TrackList", "lucide-react"], exports: ["AudioPlayer", "usePlayerState"], score: 70, external: false },
        { id: "components/MetricsCard.tsx", path: "components/MetricsCard.tsx", name: "MetricsCard.tsx", language: "TypeScript", loc: 110, lines: 130, blankLines: 12, commentLines: 8, bytes: 3900, imports: ["react", "@/lib/utils"], exports: ["MetricsCard"], score: 25, external: false },
        { id: "components/TrackList.tsx", path: "components/TrackList.tsx", name: "TrackList.tsx", language: "TypeScript", loc: 215, lines: 250, blankLines: 20, commentLines: 15, bytes: 7800, imports: ["react", "@/lib/utils", "lucide-react"], exports: ["TrackList"], score: 50, external: false },
        { id: "lib/db.ts", path: "lib/db.ts", name: "db.ts", language: "TypeScript", loc: 280, lines: 320, blankLines: 24, commentLines: 16, bytes: 9800, imports: ["@prisma/client"], exports: ["prisma", "disconnectDb", "withTransaction"], score: 85, external: false },
        { id: "lib/auth.ts", path: "lib/auth.ts", name: "auth.ts", language: "TypeScript", loc: 260, lines: 300, blankLines: 24, commentLines: 16, bytes: 9200, imports: ["jsonwebtoken", "bcryptjs", "@/lib/db"], exports: ["verifySession", "hashPassword", "signJwtToken"], score: 60, external: false },
        { id: "lib/spotify.ts", path: "lib/spotify.ts", name: "spotify.ts", language: "TypeScript", loc: 412, lines: 480, blankLines: 40, commentLines: 28, bytes: 14800, imports: ["@spotify/web-api", "axios", "@/lib/db"], exports: ["getSpotifyClient", "fetchPlaylist", "refreshUserToken"], score: 80, external: false },
        { id: "lib/utils.ts", path: "lib/utils.ts", name: "utils.ts", language: "TypeScript", loc: 95, lines: 110, blankLines: 9, commentLines: 6, bytes: 3200, imports: ["clsx", "tailwind-merge"], exports: ["cn", "formatDuration", "formatNumber"], score: 40, external: false },
        { id: "react", path: "react", name: "react", external: true, score: 90, count: 8 },
        { id: "next/server", path: "next/server", name: "next/server", external: true, score: 70, count: 3 },
        { id: "next/link", path: "next/link", name: "next/link", external: true, score: 50, count: 2 },
        { id: "@prisma/client", path: "@prisma/client", name: "@prisma/client", external: true, score: 85, count: 1 },
        { id: "jsonwebtoken", path: "jsonwebtoken", name: "jsonwebtoken", external: true, score: 45, count: 1 },
        { id: "bcryptjs", path: "bcryptjs", name: "bcryptjs", external: true, score: 40, count: 1 },
        { id: "@spotify/web-api", path: "@spotify/web-api", name: "@spotify/web-api", external: true, score: 75, count: 1 },
        { id: "lucide-react", path: "lucide-react", name: "lucide-react", external: true, score: 60, count: 3 }
      ],
      edges: [
        { source: "app/layout.tsx", target: "components/Header.tsx", kind: "local" },
        { source: "app/layout.tsx", target: "react", kind: "external" },
        { source: "app/page.tsx", target: "components/Header.tsx", kind: "local" },
        { source: "app/page.tsx", target: "react", kind: "external" },
        { source: "app/page.tsx", target: "next/link", kind: "external" },
        { source: "app/dashboard/page.tsx", target: "components/Header.tsx", kind: "local" },
        { source: "app/dashboard/page.tsx", target: "components/MetricsCard.tsx", kind: "local" },
        { source: "app/dashboard/page.tsx", target: "components/TrackList.tsx", kind: "local" },
        { source: "app/dashboard/page.tsx", target: "lib/db.ts", kind: "local" },
        { source: "app/dashboard/page.tsx", target: "react", kind: "external" },
        { source: "app/api/auth.ts", target: "lib/auth.ts", kind: "local" },
        { source: "app/api/auth.ts", target: "lib/db.ts", kind: "local" },
        { source: "app/api/auth.ts", target: "next/server", kind: "external" },
        { source: "app/api/tracks.ts", target: "lib/spotify.ts", kind: "local" },
        { source: "app/api/tracks.ts", target: "lib/db.ts", kind: "local" },
        { source: "app/api/tracks.ts", target: "next/server", kind: "external" },
        { source: "app/api/analytics.ts", target: "lib/db.ts", kind: "local" },
        { source: "app/api/analytics.ts", target: "next/server", kind: "external" },
        { source: "components/Header.tsx", target: "next/link", kind: "external" },
        { source: "components/Header.tsx", target: "lucide-react", kind: "external" },
        { source: "components/Player.tsx", target: "lib/spotify.ts", kind: "local" },
        { source: "components/Player.tsx", target: "components/TrackList.tsx", kind: "local" },
        { source: "components/Player.tsx", target: "lucide-react", kind: "external" },
        { source: "components/MetricsCard.tsx", target: "lib/utils.ts", kind: "local" },
        { source: "components/TrackList.tsx", target: "lib/utils.ts", kind: "local" },
        { source: "components/TrackList.tsx", target: "lucide-react", kind: "external" },
        { source: "lib/db.ts", target: "@prisma/client", kind: "external" },
        { source: "lib/auth.ts", target: "lib/db.ts", kind: "local" },
        { source: "lib/auth.ts", target: "jsonwebtoken", kind: "external" },
        { source: "lib/auth.ts", target: "bcryptjs", kind: "external" },
        { source: "lib/spotify.ts", target: "lib/db.ts", kind: "local" },
        { source: "lib/spotify.ts", target: "@spotify/web-api", kind: "external" }
      ]
    }
  },

  "fastapi-backend": {
    title: "NovaCore · FastAPI Microservice & Celery Worker",
    generatedAt: "2026-09-20T19:15:00.000Z",
    summary: {
      totalFiles: 28,
      sourceFiles: 22,
      scannedFiles: 22,
      maxFiles: 500,
      maxFilesReached: false,
      totalLines: 3200,
      totalCodeLines: 2650,
      totalBlankLines: 350,
      totalCommentLines: 200,
      totalBytes: 98000,
      importEdges: 42,
      externalDependencies: 9,
      languages: 3,
      frameworks: 3
    },
    stack: {
      languages: [
        { name: "Python", files: 19, lines: 2850, bytes: 87000, percent: 89 },
        { name: "SQL", files: 2, lines: 250, bytes: 7000, percent: 8 },
        { name: "YAML", files: 1, lines: 100, bytes: 4000, percent: 3 }
      ],
      frameworks: ["FastAPI", "SQLAlchemy", "Celery"]
    },
    config: { maxFiles: 500 },
    humanSummary: {
      size: "98.0 KB",
      lines: "2,650",
      physicalLines: "3,200",
      files: "28",
      sourceFiles: "22",
      edges: "42",
      dependencies: "9"
    },
    directoryTree: {
      name: ".",
      type: "directory",
      children: [
        {
          name: "app",
          type: "directory",
          children: [
            { name: "main.py", type: "file", path: "app/main.py" },
            { name: "config.py", type: "file", path: "app/config.py" },
            {
              name: "api",
              type: "directory",
              children: [
                { name: "v1_router.py", type: "file", path: "app/api/v1_router.py" },
                { name: "users.py", type: "file", path: "app/api/users.py" },
                { name: "jobs.py", type: "file", path: "app/api/jobs.py" }
              ]
            },
            {
              name: "core",
              type: "directory",
              children: [
                { name: "database.py", type: "file", path: "app/core/database.py" },
                { name: "security.py", type: "file", path: "app/core/security.py" },
                { name: "redis_cache.py", type: "file", path: "app/core/redis_cache.py" }
              ]
            },
            {
              name: "tasks",
              type: "directory",
              children: [
                { name: "worker.py", type: "file", path: "app/tasks/worker.py" },
                { name: "pipeline.py", type: "file", path: "app/tasks/pipeline.py" }
              ]
            }
          ]
        }
      ]
    },
    topFiles: [
      { path: "app/tasks/pipeline.py", language: "Python", loc: 390, imports: ["celery", "app.core.database", "app.core.redis_cache"], exports: ["run_data_pipeline", "aggregate_results"] },
      { path: "app/core/database.py", language: "Python", loc: 310, imports: ["sqlalchemy", "sqlalchemy.orm"], exports: ["get_session", "Base", "engine"] },
      { path: "app/api/users.py", language: "Python", loc: 275, imports: ["fastapi", "pydantic", "app.core.database", "app.core.security"], exports: ["create_user", "get_current_user"] }
    ],
    graph: {
      nodes: [
        { id: "app/main.py", path: "app/main.py", name: "main.py", language: "Python", loc: 120, lines: 140, blankLines: 12, commentLines: 8, bytes: 4200, imports: ["fastapi", "app.api.v1_router", "app.config"], exports: ["app"], score: 60, external: false },
        { id: "app/config.py", path: "app/config.py", name: "config.py", language: "Python", loc: 85, lines: 100, blankLines: 8, commentLines: 7, bytes: 2800, imports: ["pydantic_settings"], exports: ["Settings", "get_settings"], score: 45, external: false },
        { id: "app/api/v1_router.py", path: "app/api/v1_router.py", name: "v1_router.py", language: "Python", loc: 90, lines: 110, blankLines: 10, commentLines: 10, bytes: 3100, imports: ["fastapi", "app.api.users", "app.api.jobs"], exports: ["api_router"], score: 50, external: false },
        { id: "app/api/users.py", path: "app/api/users.py", name: "users.py", language: "Python", loc: 275, lines: 320, blankLines: 25, commentLines: 20, bytes: 9600, imports: ["fastapi", "pydantic", "app.core.database", "app.core.security"], exports: ["create_user", "get_current_user"], score: 70, external: false },
        { id: "app/api/jobs.py", path: "app/api/jobs.py", name: "jobs.py", language: "Python", loc: 220, lines: 260, blankLines: 22, commentLines: 18, bytes: 7800, imports: ["fastapi", "app.tasks.pipeline", "app.core.database"], exports: ["dispatch_job", "get_job_status"], score: 65, external: false },
        { id: "app/core/database.py", path: "app/core/database.py", name: "database.py", language: "Python", loc: 310, lines: 360, blankLines: 28, commentLines: 22, bytes: 10500, imports: ["sqlalchemy", "sqlalchemy.orm", "app.config"], exports: ["get_session", "Base", "engine"], score: 85, external: false },
        { id: "app/core/security.py", path: "app/core/security.py", name: "security.py", language: "Python", loc: 160, lines: 190, blankLines: 16, commentLines: 14, bytes: 5600, imports: ["passlib", "jose", "app.config"], exports: ["verify_password", "create_access_token"], score: 55, external: false },
        { id: "app/core/redis_cache.py", path: "app/core/redis_cache.py", name: "redis_cache.py", language: "Python", loc: 140, lines: 165, blankLines: 14, commentLines: 11, bytes: 4900, imports: ["redis", "app.config"], exports: ["get_redis", "cache_get", "cache_set"], score: 50, external: false },
        { id: "app/tasks/worker.py", path: "app/tasks/worker.py", name: "worker.py", language: "Python", loc: 95, lines: 115, blankLines: 10, commentLines: 10, bytes: 3300, imports: ["celery", "app.config"], exports: ["celery_app"], score: 45, external: false },
        { id: "app/tasks/pipeline.py", path: "app/tasks/pipeline.py", name: "pipeline.py", language: "Python", loc: 390, lines: 450, blankLines: 35, commentLines: 25, bytes: 13600, imports: ["app.tasks.worker", "app.core.database", "app.core.redis_cache"], exports: ["run_data_pipeline", "aggregate_results"], score: 75, external: false },
        { id: "fastapi", path: "fastapi", name: "fastapi", external: true, score: 90, count: 4 },
        { id: "pydantic", path: "pydantic", name: "pydantic", external: true, score: 75, count: 2 },
        { id: "sqlalchemy", path: "sqlalchemy", name: "sqlalchemy", external: true, score: 85, count: 2 },
        { id: "celery", path: "celery", name: "celery", external: true, score: 70, count: 2 },
        { id: "redis", path: "redis", name: "redis", external: true, score: 65, count: 1 },
        { id: "jose", path: "jose", name: "jose", external: true, score: 50, count: 1 }
      ],
      edges: [
        { source: "app/main.py", target: "app/api/v1_router.py", kind: "local" },
        { source: "app/main.py", target: "app/config.py", kind: "local" },
        { source: "app/main.py", target: "fastapi", kind: "external" },
        { source: "app/api/v1_router.py", target: "app/api/users.py", kind: "local" },
        { source: "app/api/v1_router.py", target: "app/api/jobs.py", kind: "local" },
        { source: "app/api/users.py", target: "app/core/database.py", kind: "local" },
        { source: "app/api/users.py", target: "app/core/security.py", kind: "local" },
        { source: "app/api/users.py", target: "fastapi", kind: "external" },
        { source: "app/api/users.py", target: "pydantic", kind: "external" },
        { source: "app/api/jobs.py", target: "app/tasks/pipeline.py", kind: "local" },
        { source: "app/api/jobs.py", target: "app/core/database.py", kind: "local" },
        { source: "app/core/database.py", target: "app/config.py", kind: "local" },
        { source: "app/core/database.py", target: "sqlalchemy", kind: "external" },
        { source: "app/core/security.py", target: "app/config.py", kind: "local" },
        { source: "app/core/security.py", target: "jose", kind: "external" },
        { source: "app/core/redis_cache.py", target: "app/config.py", kind: "local" },
        { source: "app/core/redis_cache.py", target: "redis", kind: "external" },
        { source: "app/tasks/worker.py", target: "app/config.py", kind: "local" },
        { source: "app/tasks/worker.py", target: "celery", kind: "external" },
        { source: "app/tasks/pipeline.py", target: "app/tasks/worker.py", kind: "local" },
        { source: "app/tasks/pipeline.py", target: "app/core/database.py", kind: "local" },
        { source: "app/tasks/pipeline.py", target: "app/core/redis_cache.py", kind: "local" }
      ]
    }
  }
};

module.exports = {
  SAMPLE_PROJECTS
};
