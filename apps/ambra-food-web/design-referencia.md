<!-- Login Screen -->
<!DOCTYPE html>

<html class="light" lang="pt-br"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Login - Ambra Food</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#fd5508",
                        "background-light": "#ffffff",
                        "background-dark": "#23150f",
                    },
                    fontFamily: {
                        "display": ["Inter", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.5rem",
                        "lg": "0.75rem",
                        "xl": "1.5rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        body {
            font-family: 'Inter', sans-serif;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark font-display text-[#1c110c] dark:text-white">
<div class="relative flex min-h-screen w-full flex-col overflow-x-hidden">
<!-- Top App Bar (iOS style minimal) -->
<div class="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between">
<div class="text-[#1c110c] dark:text-white flex size-12 shrink-0 items-center justify-start">
<span class="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
</div>
<div class="flex-1"></div>
<div class="w-12"></div> <!-- Spacer for symmetry -->
</div>
<div class="flex flex-col items-center px-6 pt-4 pb-8">
<!-- Logo & Brand Section -->
<div class="flex flex-col items-center gap-4 mb-8">
<div class="bg-primary rounded-full size-20 flex items-center justify-center shadow-lg shadow-primary/20" data-alt="Orange circular logo with white fork and knife icon">
<span class="material-symbols-outlined text-white text-4xl">restaurant</span>
</div>
<h1 class="text-[#1c110c] dark:text-white text-2xl font-bold leading-tight tracking-tight">Ambra Food</h1>
</div>
<!-- Segmented Control (Role Switcher) -->
<div class="w-full max-w-sm mb-6">
<div class="flex h-12 w-full items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800 p-1">
<label class="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-zinc-700 has-[:checked]:shadow-sm has-[:checked]:text-primary text-gray-500 dark:text-gray-400 text-sm font-semibold transition-all">
<span class="truncate">Aluno</span>
<input checked="" class="invisible w-0" name="user_role" type="radio" value="Aluno"/>
</label>
<label class="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-zinc-700 has-[:checked]:shadow-sm has-[:checked]:text-primary text-gray-500 dark:text-gray-400 text-sm font-semibold transition-all">
<span class="truncate">Responsável</span>
<input class="invisible w-0" name="user_role" type="radio" value="Responsável"/>
</label>
</div>
</div>
<!-- Login Form -->
<div class="w-full max-w-sm space-y-5">
<!-- Email Field -->
<div class="flex flex-col gap-1.5">
<label class="text-[#1c110c] dark:text-gray-200 text-sm font-medium ml-1">E-mail</label>
<input class="form-input flex w-full h-12 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#1c110c] dark:text-white px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400 transition-colors" placeholder="Digite seu e-mail" type="email"/>
</div>
<!-- Password Field -->
<div class="flex flex-col gap-1.5">
<label class="text-[#1c110c] dark:text-gray-200 text-sm font-medium ml-1">Senha</label>
<div class="relative flex items-center">
<input class="form-input flex w-full h-12 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#1c110c] dark:text-white px-4 pr-12 text-base focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400 transition-colors" placeholder="Digite sua senha" type="password"/>
<button class="absolute right-4 text-gray-400 dark:text-gray-500 flex items-center justify-center hover:text-primary transition-colors">
<span class="material-symbols-outlined text-[22px]">visibility</span>
</button>
</div>
</div>
<!-- Forgot Password Link -->
<div class="flex justify-end">
<a class="text-primary text-sm font-semibold hover:underline" href="#">Esqueci minha senha</a>
</div>
<!-- Submit Button -->
<button class="w-full h-12 bg-primary text-white rounded-lg font-bold text-base shadow-md shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center">
                    Entrar
                </button>
</div>
<!-- Footer Section -->
<div class="mt-auto pt-12 pb-6 flex flex-col items-center gap-4">
<p class="text-gray-500 text-sm">Ainda não tem uma conta?</p>
<button class="text-[#1c110c] dark:text-white font-bold text-sm border-b border-[#1c110c] dark:border-white pb-0.5">
                    Cadastre-se agora
                </button>
</div>
</div>
<!-- iOS Home Indicator Spacer -->
<div class="h-8 w-full bg-background-light dark:bg-background-dark"></div>
</div>
</body></html>

<!-- Student Dashboard -->
<!DOCTYPE html>

<html class="light" lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Student Dashboard - Ambra Food</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#fd5508",
                        "background-light": "#f8f6f5",
                        "background-dark": "#23150f",
                    },
                    fontFamily: {
                        "display": ["Inter", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.5rem",
                        "lg": "1rem",
                        "xl": "1.5rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        body {
            font-family: 'Inter', sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        .ios-tab-bar {
            padding-bottom: env(safe-area-inset-bottom);
        }
        .gradient-card {
            background: linear-gradient(135deg, #FC5407 0%, #e04804 100%);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark font-display text-[#1c110c] dark:text-[#fcf9f8] min-h-screen flex flex-col">
<!-- TopAppBar -->
<header class="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between pt-8">
<div class="flex flex-col flex-1">
<h2 class="text-[#1c110c] dark:text-[#fcf9f8] text-xl font-bold leading-tight tracking-[-0.015em]">Olá, João Silva</h2>
<p class="text-[#a06246] dark:text-[#d1b1a4] text-sm">Segunda-feira, 22 de Maio</p>
</div>
<div class="flex w-12 items-center justify-end">
<button class="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-white dark:bg-[#32211a] shadow-sm text-[#1c110c] dark:text-white">
<span class="material-symbols-outlined text-[24px]">notifications</span>
</button>
</div>
</header>
<main class="flex-1 px-4 py-4 overflow-y-auto pb-32">
<!-- Main Balance Card -->
<div class="gradient-card rounded-xl p-6 text-white shadow-lg relative overflow-hidden mb-6">
<div class="relative z-10">
<div class="flex justify-between items-start mb-4">
<p class="text-white/80 text-sm font-medium">Saldo Disponível</p>
<button class="text-white">
<span class="material-symbols-outlined text-[20px]">refresh</span>
</button>
</div>
<h1 class="text-5xl font-bold mb-6">R$ 150,00</h1>
<div class="flex gap-4">
<div class="flex flex-col">
<span class="text-white/70 text-xs uppercase tracking-wider">Limite Diário</span>
<span class="text-sm font-semibold">R$ 30,00</span>
</div>
<div class="w-[1px] h-8 bg-white/20"></div>
<div class="flex flex-col">
<span class="text-white/70 text-xs uppercase tracking-wider">Crédito</span>
<span class="text-sm font-semibold">R$ 0,00</span>
</div>
</div>
</div>
<!-- Decorative circle -->
<div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
</div>
<!-- Action Button -->
<div class="flex mb-8">
<button class="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-primary text-white text-lg font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all">
<span class="material-symbols-outlined mr-2">add_circle</span>
<span class="truncate">Recarregar</span>
</button>
</div>
<!-- Section Header -->
<div class="flex items-center justify-between px-1 pb-4">
<h3 class="text-[#1c110c] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Últimas Transações</h3>
<button class="text-primary text-sm font-bold">Ver todas</button>
</div>
<!-- Transaction List -->
<div class="space-y-3">
<!-- PIX Recharge Item -->
<div class="flex items-center gap-4 bg-white dark:bg-[#32211a] px-4 min-h-[80px] py-3 rounded-xl shadow-sm">
<div class="text-green-600 flex items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30 shrink-0 size-12">
<span class="material-symbols-outlined text-[24px]">account_balance_wallet</span>
</div>
<div class="flex flex-col justify-center flex-1">
<p class="text-[#1c110c] dark:text-white text-base font-semibold leading-normal line-clamp-1">Recarga PIX</p>
<p class="text-[#a06246] dark:text-[#d1b1a4] text-xs font-normal leading-normal line-clamp-2">Hoje, 10:30</p>
</div>
<div class="shrink-0">
<p class="text-green-600 text-base font-bold leading-normal">+R$ 10,00</p>
</div>
</div>
<!-- Snack Item -->
<div class="flex items-center gap-4 bg-white dark:bg-[#32211a] px-4 min-h-[80px] py-3 rounded-xl shadow-sm">
<div class="text-red-500 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 shrink-0 size-12">
<span class="material-symbols-outlined text-[24px]">fastfood</span>
</div>
<div class="flex flex-col justify-center flex-1">
<p class="text-[#1c110c] dark:text-white text-base font-semibold leading-normal line-clamp-1">Lanche - Cantina</p>
<p class="text-[#a06246] dark:text-[#d1b1a4] text-xs font-normal leading-normal line-clamp-2">Hoje, 09:15</p>
</div>
<div class="shrink-0">
<p class="text-[#1c110c] dark:text-white text-base font-bold leading-normal">-R$ 5,50</p>
</div>
</div>
<!-- Another Snack Item (Placeholder) -->
<div class="flex items-center gap-4 bg-white dark:bg-[#32211a] px-4 min-h-[80px] py-3 rounded-xl shadow-sm">
<div class="text-red-500 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 shrink-0 size-12">
<span class="material-symbols-outlined text-[24px]">lunch_dining</span>
</div>
<div class="flex flex-col justify-center flex-1">
<p class="text-[#1c110c] dark:text-white text-base font-semibold leading-normal line-clamp-1">Almoço</p>
<p class="text-[#a06246] dark:text-[#d1b1a4] text-xs font-normal leading-normal line-clamp-2">Ontem, 12:45</p>
</div>
<div class="shrink-0">
<p class="text-[#1c110c] dark:text-white text-base font-bold leading-normal">-R$ 15,00</p>
</div>
</div>
</div>
</main>
<!-- Bottom Navigation Bar -->
<nav class="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#23150f]/80 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 ios-tab-bar">
<div class="flex justify-around items-center h-16 max-w-md mx-auto">
<button class="flex flex-col items-center justify-center w-full text-primary">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">account_balance_wallet</span>
<span class="text-[10px] font-medium mt-1">Carteira</span>
</button>
<button class="flex flex-col items-center justify-center w-full text-gray-400 dark:text-gray-500">
<div class="bg-primary size-10 rounded-full flex items-center justify-center text-white -mt-8 shadow-lg shadow-primary/40">
<span class="material-symbols-outlined text-[28px]">add</span>
</div>
<span class="text-[10px] font-medium mt-1">Ações</span>
</button>
<button class="flex flex-col items-center justify-center w-full text-gray-400 dark:text-gray-500">
<span class="material-symbols-outlined">person</span>
<span class="text-[10px] font-medium mt-1">Perfil</span>
</button>
</div>
</nav>
</body></html>

<!-- Recharge Value Selection -->
<!DOCTYPE html>

<html class="light" lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Recarregar Carteira - Ambra Food</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#fd5508",
                        "background-light": "#f8f6f5",
                        "background-dark": "#23150f",
                    },
                    fontFamily: {
                        "display": ["Inter"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.5rem",
                        "lg": "1rem",
                        "xl": "1.5rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
<!-- TopAppBar -->
<header class="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
<div class="flex items-center p-4 justify-between max-w-md mx-auto">
<div class="text-primary flex size-10 shrink-0 items-center justify-center cursor-pointer">
<span class="material-symbols-outlined">arrow_back_ios</span>
</div>
<h2 class="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Recarregar Carteira</h2>
</div>
</header>
<main class="flex-1 max-w-md mx-auto w-full px-4 pt-6 pb-24">
<!-- Input Section -->
<div class="flex flex-col items-center mb-8">
<p class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Valor da Recarga</p>
<div class="relative w-full text-center">
<!-- HeadlineText Style -->
<input class="w-full bg-transparent border-none text-center text-gray-900 dark:text-white text-[48px] font-bold leading-tight focus:ring-0 p-0" type="text" value="R$ 50,00"/>
<div class="h-1 w-32 bg-primary mx-auto rounded-full mt-2"></div>
</div>
</div>
<!-- Chips Grid -->
<div class="grid grid-cols-3 gap-3 mb-10">
<button class="flex h-12 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-transform">
<p class="text-gray-900 dark:text-white text-sm font-semibold">R$ 1</p>
</button>
<button class="flex h-12 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-transform">
<p class="text-gray-900 dark:text-white text-sm font-semibold">R$ 5</p>
</button>
<button class="flex h-12 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-transform">
<p class="text-gray-900 dark:text-white text-sm font-semibold">R$ 10</p>
</button>
<button class="flex h-12 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-transform">
<p class="text-gray-900 dark:text-white text-sm font-semibold">R$ 20</p>
</button>
<!-- Selected State -->
<button class="flex h-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-transform">
<p class="text-white text-sm font-semibold">R$ 50</p>
</button>
<button class="flex h-12 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-transform">
<p class="text-gray-900 dark:text-white text-sm font-semibold">R$ 100</p>
</button>
</div>
<!-- Preview Card (Receipt) -->
<div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl overflow-hidden border border-blue-100 dark:border-blue-800 shadow-sm">
<div class="p-4 border-b border-blue-100 dark:border-blue-800">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-blue-600 dark:text-blue-400">receipt_long</span>
<h3 class="text-blue-900 dark:text-blue-200 text-base font-bold">Recibo de Pré-Pagamento</h3>
</div>
</div>
<div class="p-4 space-y-3">
<div class="flex justify-between items-center">
<p class="text-blue-700/80 dark:text-blue-300/80 text-sm">Crédito na Carteira</p>
<p class="text-green-600 dark:text-green-400 text-sm font-bold">+ R$ 50,00</p>
</div>
<div class="flex justify-between items-center">
<p class="text-blue-700/80 dark:text-blue-300/80 text-sm">Taxa PIX</p>
<p class="text-primary text-sm font-bold">+ R$ 0,00</p>
</div>
</div>
<div class="bg-primary p-4 flex justify-between items-center">
<p class="text-white text-sm font-medium">Total a pagar</p>
<p class="text-white text-xl font-bold">R$ 50,00</p>
</div>
</div>
<!-- Info Note -->
<div class="mt-6 flex gap-3 px-2">
<span class="material-symbols-outlined text-gray-400 text-[20px]">info</span>
<p class="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                O saldo será liberado imediatamente após a confirmação do pagamento via PIX. Verifique os dados antes de gerar o código.
            </p>
</div>
</main>
<!-- Footer Action -->
<div class="fixed bottom-0 left-0 right-0 p-4 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800">
<div class="max-w-md mx-auto">
<button class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-colors">
<span class="material-symbols-outlined">qr_code_2</span>
                Gerar Código PIX
            </button>
</div>
</div>
</body></html>

<!-- PIX Payment Details -->
<!DOCTYPE html>

<html class="light" lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#fd5508",
                        "background-light": "#f8f6f5",
                        "background-dark": "#23150f",
                    },
                    fontFamily: {
                        "display": ["Inter", "sans-serif"]
                    },
                    borderRadius: {"DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px"},
                },
            },
        }
    </script>
<title>PIX Payment Details</title>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="font-display bg-background-light dark:bg-background-dark text-[#1c110c] dark:text-white min-h-screen flex flex-col">
<!-- TopAppBar -->
<div class="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
<div class="text-[#1c110c] dark:text-white flex size-12 shrink-0 items-center justify-start">
<span class="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
</div>
<h2 class="text-[#1c110c] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Recarga via PIX</h2>
</div>
<main class="flex-1 overflow-y-auto pb-32">
<!-- Success State Header -->
<div class="flex flex-col items-center pt-8 pb-4">
<div class="text-green-500 mb-2">
<span class="material-symbols-outlined !text-[64px]" style="font-variation-settings: 'FILL' 1">check_circle</span>
</div>
<!-- SectionHeader -->
<h4 class="text-primary text-sm font-bold uppercase leading-normal tracking-[0.1em] px-4 py-2 text-center">PIX Gerado!</h4>
<!-- HeadlineText -->
<h1 class="text-[#1c110c] dark:text-white tracking-light text-[40px] font-bold leading-tight px-4 text-center">R$ 50,00</h1>
<p class="text-gray-500 dark:text-gray-400 text-sm">Vencimento em 30 minutos</p>
</div>
<!-- ImageGrid - Used for QR Code Container -->
<div class="flex justify-center p-4">
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
<div class="w-64 h-64 bg-center bg-no-repeat aspect-square bg-cover rounded-lg border-2 border-gray-50" data-alt="A clean black and white PIX QR Code for payment" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBn2bE-wy5LF744BNpagNpBK5RO-bZFhj3FEYg-8epdzUbTJ6DG3KgvtVy6f9rhkNriWpeWqTiBYcDZwopDi9omeqKEVAwu5_3vvLEYt6EYH904G6sMshp7_8LnsLi-tPqgP3wwqwCzFuZIXgopzcb4ngReMoFMKZHUAxT7DJtqQTz5m1ZsXD5_x7e-sdqQw0y8xpU5kbp2208eMOUh4mukku9w4mue2bmuoGz8tnhZZ8tPDxzgQLzY2ztPBl7kMIXanMmZIGI90gg");'>
</div>
<p class="mt-4 text-xs text-gray-400 font-medium">Aponte a câmera para escanear</p>
</div>
</div>
<!-- ListItem - Copy Paste Section -->
<div class="px-4 py-2">
<div class="flex flex-col gap-2 bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
<div class="flex items-center justify-between">
<p class="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">PIX Copia e Cola</p>
<button class="flex items-center gap-1 text-primary text-sm font-bold">
<span class="material-symbols-outlined text-sm">content_copy</span>
                        Copiar
                    </button>
</div>
<div class="bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
<p class="text-[#1c110c] dark:text-zinc-300 text-sm font-mono break-all leading-relaxed">
                        00020126580014BR.GOV.BCB.PIX0136422b2120-c282-429a-8a11-64e030026214
                    </p>
</div>
</div>
</div>
<!-- How to pay instruction box -->
<div class="px-4 py-4">
<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-4 rounded-xl">
<div class="flex items-center gap-2 mb-2">
<span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">info</span>
<h5 class="text-blue-900 dark:text-blue-200 font-bold text-sm">Como pagar?</h5>
</div>
<ul class="space-y-2">
<li class="flex gap-3 text-sm text-blue-800 dark:text-blue-300">
<span class="font-bold">1.</span>
<p>Abra o app do seu banco e escolha a opção PIX.</p>
</li>
<li class="flex gap-3 text-sm text-blue-800 dark:text-blue-300">
<span class="font-bold">2.</span>
<p>Selecione "Ler QR Code" ou "Pix Copia e Cola".</p>
</li>
<li class="flex gap-3 text-sm text-blue-800 dark:text-blue-300">
<span class="font-bold">3.</span>
<p>Confirme os dados e finalize o pagamento.</p>
</li>
</ul>
</div>
</div>
</main>
<!-- Action Footer (Buttons) -->
<div class="fixed bottom-0 left-0 right-0 p-4 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-zinc-800 flex flex-col gap-3 pb-8">
<button class="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined">account_balance_wallet</span>
            Voltar Carteira
        </button>
<button class="w-full bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-[#1c110c] dark:text-white font-bold py-4 rounded-xl transition-colors">
            Nova Recarga
        </button>
</div>
</body></html>

<!-- User Profile -->
<!DOCTYPE html>

<html class="light" lang="pt-br"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>User Profile - Ambra Food</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#fd5508",
                        "background-light": "#f8f6f5",
                        "background-dark": "#23150f",
                    },
                    fontFamily: {
                        "display": ["Inter", "sans-serif"],
                        "mono": ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"]
                    },
                    borderRadius: {"DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px"},
                },
            },
        }
    </script>
<style>
        body {
            font-family: 'Inter', sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        .ios-blur {
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen pb-24">
<!-- Top Navigation Bar -->
<header class="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 ios-blur border-b border-slate-200 dark:border-slate-800">
<div class="flex items-center h-14 px-4 justify-between">
<button class="w-10 h-10 flex items-center justify-start text-primary">
<span class="material-symbols-outlined">chevron_left</span>
</button>
<h1 class="text-lg font-semibold tracking-tight">Perfil</h1>
<div class="w-10"></div>
</div>
</header>
<main class="max-w-md mx-auto px-4 py-8">
<!-- Profile Header Section -->
<section class="flex flex-col items-center mb-10">
<div class="relative mb-4">
<div class="w-32 h-32 bg-primary rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-primary/20 ring-4 ring-white dark:ring-slate-800" data-alt="Orange circular avatar with initials JS">
                    JS
                </div>
<div class="absolute bottom-1 right-1 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-600">
<span class="material-symbols-outlined text-primary text-sm">photo_camera</span>
</div>
</div>
<h2 class="text-2xl font-bold dark:text-white">João Silva</h2>
<p class="text-slate-500 dark:text-slate-400 text-sm mt-1">joao.silva@email.com</p>
</section>
<!-- Information Cards -->
<div class="space-y-4 mb-8">
<!-- Account Type -->
<div class="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
<div class="flex items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0 w-12 h-12">
<span class="material-symbols-outlined text-primary">school</span>
</div>
<div class="flex flex-col">
<p class="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Tipo Conta</p>
<p class="text-slate-900 dark:text-white text-base font-semibold">Estudante</p>
</div>
</div>
<!-- User ID -->
<div class="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
<div class="flex items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0 w-12 h-12">
<span class="material-symbols-outlined text-primary">fingerprint</span>
</div>
<div class="flex flex-col">
<p class="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">ID Usuário</p>
<p class="text-slate-900 dark:text-white text-base font-mono font-bold tracking-tight">AMB-9921-X</p>
</div>
</div>
</div>
<!-- Action Buttons -->
<div class="space-y-3">
<button class="w-full h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 rounded-xl text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
<span class="material-symbols-outlined">logout</span>
                Sair
            </button>
</div>
<!-- App Metadata -->
<footer class="mt-12 text-center">
<p class="text-slate-400 dark:text-slate-600 text-xs font-medium">Ambra Food v1.0.0</p>
</footer>
</main>
<!-- Bottom Navigation Bar -->
<nav class="fixed bottom-0 inset-x-0 bg-white/90 dark:bg-slate-900/90 ios-blur border-t border-slate-200 dark:border-slate-800 px-6 py-3 safe-area-bottom">
<div class="max-w-md mx-auto flex justify-between items-center">
<div class="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
<span class="material-symbols-outlined">home</span>
<span class="text-[10px] font-medium">Início</span>
</div>
<div class="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
<span class="material-symbols-outlined">wallet</span>
<span class="text-[10px] font-medium">Carteira</span>
</div>
<div class="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
<span class="material-symbols-outlined">restaurant</span>
<span class="text-[10px] font-medium">Cardápio</span>
</div>
<div class="flex flex-col items-center gap-1 text-primary">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">person</span>
<span class="text-[10px] font-medium">Perfil</span>
</div>
</div>
</nav>
</body></html>

<!-- Parent Dashboard (Responsável) -->
<!DOCTYPE html>

<html class="light" lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Ambra Food - Painel do Responsável</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#fd5508",
                        "background-light": "#f8f6f5",
                        "background-dark": "#23150f",
                    },
                    fontFamily: {
                        "display": ["Inter"]
                    },
                    borderRadius: {"DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px"},
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body {
            -webkit-tap-highlight-color: transparent;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark font-display text-[#1c110c] dark:text-white min-h-screen pb-24">
<!-- Top App Bar -->
<header class="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[#e9d6cd]/30 dark:border-white/10">
<div class="flex items-center gap-3">
<div class="size-10 rounded-full bg-center bg-cover border-2 border-primary" data-alt="User profile picture" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDBNTtRZtk6SQV2SvqQYJs3NHVqT4ThXtbTwmmHKQvqNkgFy17WBhLiPKTq4NF2MB_0_4VOV0r0qpufyEJZi10rTKm8BoIZcjBJblv4Yn5bdm8hE4XXS5kQbC-wlOAOinNRN6vqO6lvnpsXk8Ug1q7v3OdZGt9iYClXyS5RCfaHje9osTIVqkP31oM2laLkMp5foz5RP-uPC5qd289RGPsZ8gvOkDVUcbXZTAmIpojBdWIdei7DQLsVX-oxo1jU35xnpYUDCXWoWSg");'>
</div>
<div>
<p class="text-xs text-[#a06246] dark:text-gray-400 font-medium">Olá, Ana Paula</p>
<h1 class="text-lg font-bold leading-tight">Ambra Food</h1>
</div>
</div>
<button class="p-2 text-[#1c110c] dark:text-white">
<span class="material-symbols-outlined">notifications</span>
</button>
</header>
<main class="max-w-md mx-auto">
<!-- Student Selector (TextField Component Adaptation) -->
<section class="px-4 py-4">
<label class="flex flex-col w-full">
<p class="text-[#1c110c] dark:text-white text-sm font-semibold leading-normal pb-2 px-1">Selecione o Estudante</p>
<div class="relative">
<select class="appearance-none flex w-full min-w-0 flex-1 rounded-xl text-[#1c110c] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#e9d6cd] dark:border-white/10 bg-white dark:bg-[#2d1b14] h-14 pl-12 pr-10 text-base font-medium leading-normal">
<option value="maria">Maria Silva (6º Ano A)</option>
<option value="pedro">Pedro Silva (3º Ano B)</option>
</select>
<div class="absolute left-4 top-1/2 -translate-y-1/2">
<span class="material-symbols-outlined text-primary">face</span>
</div>
<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
<span class="material-symbols-outlined text-[#a06246]">unfold_more</span>
</div>
</div>
</label>
</section>
<!-- Balance Card (Card Component Adaptation) -->
<section class="px-4 py-2">
<div class="flex flex-col items-stretch justify-start rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-white dark:bg-[#2d1b14] overflow-hidden border border-[#e9d6cd]/30 dark:border-white/5">
<div class="p-6">
<div class="flex items-center justify-between mb-2">
<p class="text-[#a06246] dark:text-gray-400 text-sm font-medium leading-normal">Saldo da Carteira</p>
<span class="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold uppercase rounded-full tracking-wider">Ativo</span>
</div>
<p class="text-[#1c110c] dark:text-white text-4xl font-extrabold leading-tight tracking-tight">R$ 45,00</p>
<div class="mt-4 flex items-center gap-2 text-xs text-[#a06246] dark:text-gray-400">
<span class="material-symbols-outlined text-sm">schedule</span>
<p>Última atualização: Hoje, 10:45</p>
</div>
</div>
<div class="h-1 bg-primary w-full opacity-20"></div>
</div>
</section>
<!-- Specialized Actions (ButtonGroup Component Adaptation) -->
<section class="px-4 py-4">
<div class="flex flex-row gap-3">
<button class="flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl h-14 bg-white dark:bg-[#2d1b14] border border-[#e9d6cd] dark:border-white/10 text-[#1c110c] dark:text-white text-base font-bold transition-all active:scale-95 shadow-sm">
<span class="material-symbols-outlined text-red-500">lock</span>
<span class="truncate">Bloquear</span>
</button>
<button class="flex-[1.5] flex cursor-pointer items-center justify-center gap-2 rounded-xl h-14 bg-primary text-white text-base font-bold transition-all active:scale-95 shadow-md shadow-primary/20">
<span class="material-symbols-outlined">add_circle</span>
<span class="truncate">Recarregar</span>
</button>
</div>
</section>
<!-- Section Header -->
<section class="px-4 pt-4 flex items-center justify-between">
<h3 class="text-[#1c110c] dark:text-white text-lg font-bold leading-tight tracking-tight">Histórico de Gastos</h3>
<button class="text-primary text-sm font-semibold">Ver todos</button>
</section>
<!-- Transaction List -->
<section class="px-4 py-3 space-y-3">
<!-- Item 1 -->
<div class="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#2d1b14] border border-[#e9d6cd]/30 dark:border-white/5">
<div class="flex items-center gap-3">
<div class="size-10 rounded-lg bg-orange-100 dark:bg-primary/20 flex items-center justify-center text-primary">
<span class="material-symbols-outlined">lunch_dining</span>
</div>
<div>
<p class="text-sm font-bold text-[#1c110c] dark:text-white">Sanduíche Natural</p>
<p class="text-xs text-[#a06246] dark:text-gray-400">Hoje, 12:30 • Cantina Principal</p>
</div>
</div>
<p class="text-sm font-bold text-red-500">- R$ 12,00</p>
</div>
<!-- Item 2 -->
<div class="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#2d1b14] border border-[#e9d6cd]/30 dark:border-white/5">
<div class="flex items-center gap-3">
<div class="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
<span class="material-symbols-outlined">local_drink</span>
</div>
<div>
<p class="text-sm font-bold text-[#1c110c] dark:text-white">Suco de Laranja</p>
<p class="text-xs text-[#a06246] dark:text-gray-400">Ontem, 10:15 • Cantina Bloco B</p>
</div>
</div>
<p class="text-sm font-bold text-red-500">- R$ 7,50</p>
</div>
<!-- Item 3 -->
<div class="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#2d1b14] border border-[#e9d6cd]/30 dark:border-white/5">
<div class="flex items-center gap-3">
<div class="size-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-500">
<span class="material-symbols-outlined">payments</span>
</div>
<div>
<p class="text-sm font-bold text-[#1c110c] dark:text-white">Recarga Pix</p>
<p class="text-xs text-[#a06246] dark:text-gray-400">22 Out, 09:00</p>
</div>
</div>
<p class="text-sm font-bold text-green-500">+ R$ 50,00</p>
</div>
</section>
</main>
<!-- Fixed Bottom Navigation (iOS Style) -->
<nav class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#1a100c]/95 backdrop-blur-xl border-t border-[#e9d6cd]/50 dark:border-white/10 px-6 py-2 pb-6">
<div class="max-w-md mx-auto flex items-center justify-between">
<button class="flex flex-col items-center gap-1 text-primary">
<span class="material-symbols-outlined">home</span>
<span class="text-[10px] font-bold">Início</span>
</button>
<button class="flex flex-col items-center gap-1 text-[#a06246] dark:text-gray-400">
<span class="material-symbols-outlined">history</span>
<span class="text-[10px] font-medium">Extrato</span>
</button>
<button class="flex flex-col items-center gap-1 text-[#a06246] dark:text-gray-400">
<span class="material-symbols-outlined">nutrition</span>
<span class="text-[10px] font-medium">Cardápio</span>
</button>
<button class="flex flex-col items-center gap-1 text-[#a06246] dark:text-gray-400">
<span class="material-symbols-outlined">settings</span>
<span class="text-[10px] font-medium">Ajustes</span>
</button>
</div>
</nav>
</body></html>

<!-- Guardian Dashboard -->
<!DOCTYPE html>

<html class="light" lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Guardian Dashboard - Ambra Food</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "primary": "#fd5908",
                "background-light": "#f8f6f5",
                "background-dark": "#23160f",
              },
              fontFamily: {
                "display": ["Inter"]
              },
              borderRadius: {"DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px"},
            },
          },
        }
      </script>
<style>
        body {
            font-family: 'Inter', sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        .ios-tab-bar {
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
        .balance-card-gradient {
            background: linear-gradient(135deg, #FC5407 0%, #e04804 100%);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark text-[#1c120c] dark:text-[#fcf9f8] min-h-screen pb-24">
<!-- Top App Bar / Student Selector -->
<header class="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-4 flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="relative">
<div class="w-12 h-12 rounded-full border-2 border-primary overflow-hidden bg-gray-200">
<img alt="Foto da estudante Maria Silva" class="w-full h-full object-cover" data-alt="Portrait of a young smiling female student" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKfot9hZUbjk-1bgESA9xOoOx9eGh62MsS42DAj9H5CKe76wzWjiGvjnN1RupkRc9G44m55LKRCThOB5ZddEJj2KCSujdsw89NPKELkFAz-tWau3iD_BroJZKEBGsa-dqhzq0CdysTn_5WheWtsN5Zb2URbmNBBkqp3teC4ZhjIZu7t0HN4kGSMLnv62oSy-ij3gMucib3bjKHaAeSm2dPcryjeyqreXFhp_cZ1u8gMuKY1hbyOcxYptQ0m-qC5QhklIfOxkYLbGY"/>
</div>
<div class="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 border-2 border-background-light dark:border-background-dark">
<span class="material-symbols-outlined text-[14px] block">sync</span>
</div>
</div>
<div>
<div class="flex items-center gap-1">
<h2 class="text-lg font-bold leading-tight">Maria Silva</h2>
<span class="material-symbols-outlined text-[#a06446] text-xl">expand_more</span>
</div>
<p class="text-sm text-[#a06446] font-medium">9º Ano - Turma B</p>
</div>
</div>
<button class="w-10 h-10 flex items-center justify-center rounded-full bg-[#f4ebe6] dark:bg-white/10">
<span class="material-symbols-outlined text-[#1c120c] dark:text-white">notifications</span>
</button>
</header>
<main class="max-w-md mx-auto">
<!-- Balance Card -->
<div class="px-4 py-4">
<div class="balance-card-gradient rounded-xl p-6 shadow-lg shadow-primary/20 text-white flex flex-col justify-between aspect-[16/9] min-h-[180px]">
<div class="flex justify-between items-start">
<div>
<p class="text-white/80 text-sm font-medium uppercase tracking-wider">Carteira Digital</p>
<h1 class="text-4xl font-bold mt-1">R$ 150,00</h1>
</div>
<div class="bg-white/20 p-2 rounded-lg">
<span class="material-symbols-outlined text-2xl">account_balance_wallet</span>
</div>
</div>
<div class="flex items-center gap-2">
<div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
<p class="text-white/90 text-sm font-medium">Saldo disponível para uso</p>
</div>
</div>
</div>
<!-- Action Buttons -->
<div class="flex gap-4 px-4 py-2">
<button class="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95">
<span class="material-symbols-outlined">add_circle</span>
<span class="text-base">Recarregar</span>
</button>
<button class="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl border border-red-200 dark:border-red-800/50 flex items-center justify-center gap-2 transition-all active:scale-95">
<span class="material-symbols-outlined">block</span>
<span class="text-base">Bloquear</span>
</button>
</div>
<!-- Section Header -->
<div class="px-4 pt-8 pb-2 flex justify-between items-end">
<h3 class="text-xl font-bold tracking-tight">Transações Recentes</h3>
<button class="text-primary font-semibold text-sm">Ver todas</button>
</div>
<!-- Transaction List -->
<div class="px-4 space-y-2">
<!-- Item 1 -->
<div class="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
<div class="flex items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30 text-primary shrink-0 w-12 h-12">
<span class="material-symbols-outlined">restaurant</span>
</div>
<div class="flex-1">
<p class="font-bold text-[#1c120c] dark:text-[#fcf9f8] text-base">Cantina Central</p>
<p class="text-[#a06446] text-sm font-medium">Hoje, 10:30 • Lanche</p>
</div>
<div class="text-right">
<p class="text-[#1c120c] dark:text-[#fcf9f8] font-bold">- R$ 12,00</p>
</div>
</div>
<!-- Item 2 -->
<div class="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
<div class="flex items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 shrink-0 w-12 h-12">
<span class="material-symbols-outlined">payments</span>
</div>
<div class="flex-1">
<p class="font-bold text-[#1c120c] dark:text-[#fcf9f8] text-base">Recarga App</p>
<p class="text-[#a06446] text-sm font-medium">Ontem, 18:15 • PIX</p>
</div>
<div class="text-right">
<p class="text-green-600 font-bold">+ R$ 50,00</p>
</div>
</div>
<!-- Item 3 -->
<div class="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
<div class="flex items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 shrink-0 w-12 h-12">
<span class="material-symbols-outlined">menu_book</span>
</div>
<div class="flex-1">
<p class="font-bold text-[#1c120c] dark:text-[#fcf9f8] text-base">Papelaria Escolar</p>
<p class="text-[#a06446] text-sm font-medium">22 Out, 14:00 • Material</p>
</div>
<div class="text-right">
<p class="text-[#1c120c] dark:text-[#fcf9f8] font-bold">- R$ 35,50</p>
</div>
</div>
<!-- Item 4 -->
<div class="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 opacity-80">
<div class="flex items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30 text-primary shrink-0 w-12 h-12">
<span class="material-symbols-outlined">icecream</span>
</div>
<div class="flex-1">
<p class="font-bold text-[#1c120c] dark:text-[#fcf9f8] text-base">Quiosque Pátio</p>
<p class="text-[#a06446] text-sm font-medium">21 Out, 15:45 • Sobremesa</p>
</div>
<div class="text-right">
<p class="text-[#1c120c] dark:text-[#fcf9f8] font-bold">- R$ 8,00</p>
</div>
</div>
</div>
<!-- Bottom Spacing for Nav -->
<div class="h-10"></div>
</main>
<!-- Navigation Bar -->
<nav class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#1c120c]/95 ios-tab-bar border-t border-gray-200 dark:border-white/10 px-6 pt-3 pb-6 z-30">
<div class="max-w-md mx-auto flex justify-between items-center">
<!-- Carteira (Active) -->
<a class="flex flex-col items-center gap-1 group" href="#">
<div class="text-primary transition-colors">
<span class="material-symbols-outlined text-[28px] fill-[1]">account_balance_wallet</span>
</div>
<span class="text-xs font-bold text-primary">Carteira</span>
</a>
<!-- Loja -->
<a class="flex flex-col items-center gap-1 group" href="#">
<div class="text-[#a06446] dark:text-[#f4ebe6]/60 group-hover:text-primary transition-colors">
<span class="material-symbols-outlined text-[28px]">shopping_basket</span>
</div>
<span class="text-xs font-medium text-[#a06446] dark:text-[#f4ebe6]/60">Loja</span>
</a>
<!-- Config -->
<a class="flex flex-col items-center gap-1 group" href="#">
<div class="text-[#a06446] dark:text-[#f4ebe6]/60 group-hover:text-primary transition-colors">
<span class="material-symbols-outlined text-[28px]">settings</span>
</div>
<span class="text-xs font-medium text-[#a06446] dark:text-[#f4ebe6]/60">Config</span>
</a>
<!-- Perfil -->
<a class="flex flex-col items-center gap-1 group" href="#">
<div class="text-[#a06446] dark:text-[#f4ebe6]/60 group-hover:text-primary transition-colors">
<span class="material-symbols-outlined text-[28px]">person</span>
</div>
<span class="text-xs font-medium text-[#a06446] dark:text-[#f4ebe6]/60">Perfil</span>
</a>
</div>
</nav>
</body></html>

<!-- Student Store (Cantina) -->
<!DOCTYPE html>

<html class="light" lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#f35912",
                        "background-light": "#f8f6f5",
                        "background-dark": "#221610",
                    },
                    fontFamily: {
                        "display": ["Plus Jakarta Sans"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.5rem",
                        "lg": "1rem",
                        "xl": "1.5rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        body {
            font-family: "Plus Jakarta Sans", sans-serif;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark font-display text-[#1c120d] dark:text-white min-h-screen">
<!-- Top Bar -->
<header class="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
<div class="flex items-center p-4 pb-2 justify-between">
<div class="text-[#1c120d] dark:text-white flex size-10 shrink-0 items-center justify-start cursor-pointer">
<span class="material-symbols-outlined">arrow_back_ios</span>
</div>
<h2 class="text-[#1c120d] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Cantina</h2>
</div>
<!-- Search Bar -->
<div class="px-4 py-2">
<label class="flex flex-col min-w-40 h-11 w-full">
<div class="flex w-full flex-1 items-stretch rounded-xl h-full bg-[#f4ebe7] dark:bg-[#36261d]">
<div class="text-[#9c6449] dark:text-[#c4a18e] flex items-center justify-center pl-4">
<span class="material-symbols-outlined">search</span>
</div>
<input class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#1c120d] dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent placeholder:text-[#9c6449] dark:placeholder:text-[#c4a18e] px-4 pl-2 text-base font-normal leading-normal" placeholder="Buscar produtos..."/>
</div>
</label>
</div>
<!-- Tabs -->
<div class="pb-1">
<div class="flex border-b border-[#e8d7ce] dark:border-[#4a352a] px-4 gap-8 overflow-x-auto no-scrollbar">
<a class="flex flex-col items-center justify-center border-b-[3px] border-primary text-[#1c120d] dark:text-white pb-[13px] pt-4 whitespace-nowrap" href="#">
<p class="text-sm font-bold leading-normal tracking-wide">Tudo</p>
</a>
<a class="flex flex-col items-center justify-center border-b-[3px] border-transparent text-[#9c6449] dark:text-[#c4a18e] pb-[13px] pt-4 whitespace-nowrap" href="#">
<p class="text-sm font-bold leading-normal tracking-wide">Lanches</p>
</a>
<a class="flex flex-col items-center justify-center border-b-[3px] border-transparent text-[#9c6449] dark:text-[#c4a18e] pb-[13px] pt-4 whitespace-nowrap" href="#">
<p class="text-sm font-bold leading-normal tracking-wide">Bebidas</p>
</a>
<a class="flex flex-col items-center justify-center border-b-[3px] border-transparent text-[#9c6449] dark:text-[#c4a18e] pb-[13px] pt-4 whitespace-nowrap" href="#">
<p class="text-sm font-bold leading-normal tracking-wide">Doces</p>
</a>
</div>
</div>
</header>
<main class="pb-32">
<!-- Product Grid -->
<div class="grid grid-cols-2 gap-4 p-4">
<!-- Product 1 -->
<div class="flex flex-col gap-3 pb-3 bg-white dark:bg-[#2d1e16] p-3 rounded-xl shadow-sm border border-[#e8d7ce]/30 dark:border-[#4a352a]">
<div class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg" data-alt="Fresh natural orange juice in a clear glass" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBEu41lyr1ggSJIMNr1CXZF45qMKG-uY-jdLyDY5nlLXWvSfVu3VX_bL6QEHfnVb5zyaUg7Lv4OaQ3fcQ2TWfHv94UhGoYCnRWdel5qqDdDpLzjoXJ59iwpb2QwujW_cCMmWBlq2SoqbPwXENgzC-5SALPghA3NG7FFf9YCOuKRD9a1wtcedhFqOA2GZRBpM0Ih9U6zy9yPbTS_lwOMIVqMJgvnwr-5bNSX_AAZsQbMfdWk__4WKURPXeqE1iLDYoFTde-heOmTCpE");'>
</div>
<div class="flex flex-col flex-1 justify-between">
<div>
<p class="text-[#1c120d] dark:text-white text-base font-bold leading-snug">Suco Natural</p>
<p class="text-primary text-base font-bold leading-normal mt-1">R$ 5,50</p>
</div>
<button class="mt-3 w-full bg-primary text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-sm">add</span>
                        Adicionar
                    </button>
</div>
</div>
<!-- Product 2 -->
<div class="flex flex-col gap-3 pb-3 bg-white dark:bg-[#2d1e16] p-3 rounded-xl shadow-sm border border-[#e8d7ce]/30 dark:border-[#4a352a]">
<div class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg" data-alt="Golden brazilian cheese bread balls" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBft7q0vpq9FFzrZMMnatt-X7X07tP1AGAZJRY98DTevKoIgCjNvhj-tc-uxPjroDjEjDgMhqAlkEDRb3AU6MlcmqGnmlGbfvM-A6Bc6q3MherVkGa-JAX7YR122Tq8OjASyVzXnYf8NGeK8cM1fZeeywRz-F0lsdVFAIa4qVoKDYB0BFgm-6ueVZR6GC2eIk7CNfcyDp7OolVhgZMtkp9z8KD43tYBFFnEAwD2ZEpeSnvq8fYc-Pu2BrbFiamzOFK8dGHSGlO9E0I");'>
</div>
<div class="flex flex-col flex-1 justify-between">
<div>
<p class="text-[#1c120d] dark:text-white text-base font-bold leading-snug">Pão de Queijo</p>
<p class="text-primary text-base font-bold leading-normal mt-1">R$ 3,00</p>
</div>
<button class="mt-3 w-full bg-primary text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-sm">add</span>
                        Adicionar
                    </button>
</div>
</div>
<!-- Product 3 -->
<div class="flex flex-col gap-3 pb-3 bg-white dark:bg-[#2d1e16] p-3 rounded-xl shadow-sm border border-[#e8d7ce]/30 dark:border-[#4a352a]">
<div class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg" data-alt="Toasted sandwich with ham and melted cheese" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBfpsGuHWgJqRlMcAw7FcBiuduLqNshOYfJnwF5fKv12yOx-iY28b9csca0LCJYJN-dTydBxjyaIqBeoAhvMMg9adsHOyYsq8EqW1wFRYL2XwbVC5vMRjpM_Vc2WdGJIxq9UMLsgwAfS4CNGFp1LvycxJYabZcIVzY-hYxbjZp3SKT84dXJyvaiHgUzYykEdWUjM-xiJ1Dy5rec7-GqQZMDO4f9ceLWJ81FR31vbiOiT3uKoGhcXw4gBOhcF90soyZac_x9Lwfy7z8");'>
</div>
<div class="flex flex-col flex-1 justify-between">
<div>
<p class="text-[#1c120d] dark:text-white text-base font-bold leading-snug">Misto Quente</p>
<p class="text-primary text-base font-bold leading-normal mt-1">R$ 7,50</p>
</div>
<button class="mt-3 w-full bg-primary text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-sm">add</span>
                        Adicionar
                    </button>
</div>
</div>
<!-- Product 4 -->
<div class="flex flex-col gap-3 pb-3 bg-white dark:bg-[#2d1e16] p-3 rounded-xl shadow-sm border border-[#e8d7ce]/30 dark:border-[#4a352a]">
<div class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg" data-alt="Fresh seasonal fruit salad bowl" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuB97Iq_Xmxl8J9dFiZlTHGlQ3pNTqbJGyrM80Egk03LrVZDOUEJRLHh9y7V9BnliX13aMNZf_ei_IEAhttStb2hZ9R7yOS-Ft1Hnh99tBGhO6PLloKFCxgRZ0HP_MwCXB78plLAk4fWGvq911jFEcToZk3qpkoj6ENmNk1ssBBHmsImZvpwed6ri8Tf22GX_puEwJnHPJOje_HPhG52twCKFbRMFGpdSb2WkofHGdoKNLjK6AJg2f5wJql2bp-qIHiW-mbq8ZsXBB0");'>
</div>
<div class="flex flex-col flex-1 justify-between">
<div>
<p class="text-[#1c120d] dark:text-white text-base font-bold leading-snug">Salada de Frutas</p>
<p class="text-primary text-base font-bold leading-normal mt-1">R$ 6,00</p>
</div>
<button class="mt-3 w-full bg-primary text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-sm">add</span>
                        Adicionar
                    </button>
</div>
</div>
</div>
</main>
<!-- Floating Action Button -->
<div class="fixed bottom-24 right-4 z-40">
<button class="flex items-center justify-center rounded-full h-14 px-6 bg-primary text-white text-base font-bold shadow-lg ring-4 ring-white dark:ring-[#221610] gap-3">
<span class="material-symbols-outlined">shopping_cart</span>
<span class="truncate">Carrinho (2) R$ 8,50</span>
</button>
</div>
<!-- Bottom Navigation -->
<nav class="fixed bottom-0 w-full bg-white dark:bg-[#2d1e16] border-t border-[#e8d7ce] dark:border-[#4a352a] flex justify-around items-center py-3 px-2 z-50">
<div class="flex flex-col items-center gap-1 text-[#9c6449] dark:text-[#c4a18e]">
<span class="material-symbols-outlined">home</span>
<span class="text-[10px] font-bold">Início</span>
</div>
<div class="flex flex-col items-center gap-1 text-primary">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">store</span>
<span class="text-[10px] font-bold">Loja</span>
</div>
<div class="flex flex-col items-center gap-1 text-[#9c6449] dark:text-[#c4a18e]">
<span class="material-symbols-outlined">receipt_long</span>
<span class="text-[10px] font-bold">Pedidos</span>
</div>
<div class="flex flex-col items-center gap-1 text-[#9c6449] dark:text-[#c4a18e]">
<span class="material-symbols-outlined">account_balance_wallet</span>
<span class="text-[10px] font-bold">Carteira</span>
</div>
</nav>
</body></html>

<!-- Parental Controls Settings -->
<!DOCTYPE html>

<html class="light" lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Configurações de Controle Parental</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#137fec",
                        "background-light": "#f6f7f8",
                        "background-dark": "#101922",
                    },
                    fontFamily: {
                        "display": ["Inter"]
                    },
                    borderRadius: { "DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px" },
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .ios-blur {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="font-display bg-background-light dark:bg-background-dark text-[#0d141b] dark:text-slate-50 min-h-screen flex flex-col items-center">
<!-- App Container (Mobile viewport) -->
<div class="relative w-full max-w-[480px] min-h-screen bg-background-light dark:bg-background-dark flex flex-col overflow-hidden pb-24">
<!-- TopAppBar -->
<header class="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 ios-blur pt-2">
<div class="flex items-center p-4 pb-2 justify-between">
<div class="text-[#0d141b] dark:text-slate-50 flex size-12 shrink-0 items-center justify-start">
<span class="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
</div>
<h2 class="text-[#0d141b] dark:text-slate-50 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Configurações</h2>
<div class="flex w-12 items-center justify-end">
<button class="flex items-center justify-center rounded-xl h-12 bg-transparent text-primary font-bold">
<span class="material-symbols-outlined">check</span>
</button>
</div>
</div>
<!-- Child Selector (Maria Silva) -->
<div class="px-4 py-2">
<div class="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 border-2 border-primary/20" data-alt="Profile picture of a young female student Maria Silva" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuB4GbpqBjSxucS13YdSY1Q041MXK1BeaR2olzs-_MUn6dKecvfsBLMAoWqC0BpbAx1MTa_I-RbrD3eswRfx_Qv819mAYhc_BXwjpOO6cyBuBw-MUMUKygZqWGvdHHYdFEx-GFXvDjsg-dA3iJJSd6ko5_GUZko9RmxsH3BOFDtaXdqJIRmZNx5T8bLqUY5E4gwDRwNFAW43BJtfzmuIWdCtFPiBTNnAt4bYnSvu_ZUF2IT4wL0tQHvuCszfzzvW3tWLDY0l9YskD7w");'>
</div>
<div class="flex-1">
<p class="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Dependente</p>
<p class="text-[#0d141b] dark:text-slate-50 text-base font-bold leading-none">Maria Silva</p>
</div>
<div class="shrink-0 text-slate-400">
<span class="material-symbols-outlined">expand_more</span>
</div>
</div>
</div>
</header>
<!-- Main Content -->
<main class="flex-1 overflow-y-auto">
<!-- Section: Controle Parental -->
<div class="mt-4">
<h2 class="text-[#0d141b] dark:text-slate-50 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2">Controle Parental</h2>
<!-- TextField: Gasto Diário -->
<div class="flex flex-col gap-4 px-4 py-3">
<label class="flex flex-col w-full">
<p class="text-[#0d141b] dark:text-slate-300 text-base font-medium leading-normal pb-2">Gasto Diário Máximo</p>
<div class="flex w-full items-stretch rounded-xl shadow-sm">
<div class="flex items-center justify-center px-4 bg-white dark:bg-slate-800 border border-[#cfdbe7] dark:border-slate-700 rounded-l-xl text-slate-500">
<span class="text-base font-bold">R$</span>
</div>
<input class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-[#0d141b] dark:text-white focus:outline-0 focus:ring-0 border-y border-x-0 border-[#cfdbe7] dark:border-slate-700 bg-white dark:bg-slate-800 h-14 placeholder:text-slate-400 p-[15px] text-lg font-bold leading-normal" type="text" value="20,00"/>
<div class="text-primary flex border border-[#cfdbe7] dark:border-slate-700 bg-white dark:bg-slate-800 items-center justify-center px-4 rounded-r-xl border-l-0">
<span class="material-symbols-outlined text-[20px]">edit</span>
</div>
</div>
</label>
</div>
</div>
<!-- Section: Bloqueio Nutricional -->
<div class="mt-4">
<h2 class="text-[#0d141b] dark:text-slate-50 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Bloqueio Nutricional</h2>
<div class="mx-4 bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
<!-- List Item: Doces -->
<div class="flex items-center gap-4 px-4 py-4 justify-between border-b border-slate-100 dark:border-slate-700">
<div class="flex items-center gap-3">
<div class="flex size-10 items-center justify-center bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600">
<span class="material-symbols-outlined">icecream</span>
</div>
<p class="text-[#0d141b] dark:text-slate-50 text-base font-semibold">Doces</p>
</div>
<div class="shrink-0 flex items-center">
<!-- Toggle (ON/RED) -->
<div class="w-12 h-7 bg-red-500 rounded-full relative flex items-center px-1 shadow-inner">
<div class="w-5 h-5 bg-white rounded-full shadow-md ml-auto"></div>
</div>
</div>
</div>
<!-- List Item: Refrigerante -->
<div class="flex items-center gap-4 px-4 py-4 justify-between">
<div class="flex items-center gap-3">
<div class="flex size-10 items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
<span class="material-symbols-outlined">local_drink</span>
</div>
<p class="text-[#0d141b] dark:text-slate-50 text-base font-semibold">Refrigerante</p>
</div>
<div class="shrink-0 flex items-center">
<!-- Toggle (OFF) -->
<div class="w-12 h-7 bg-slate-200 dark:bg-slate-700 rounded-full relative flex items-center px-1">
<div class="w-5 h-5 bg-white rounded-full shadow-md"></div>
</div>
</div>
</div>
</div>
<p class="px-5 pt-2 text-xs text-slate-500">Itens bloqueados não poderão ser adquiridos na cantina usando o saldo do aluno.</p>
</div>
<!-- Section: Notificações -->
<div class="mt-8 mb-8 px-4">
<h3 class="text-[#0d141b] dark:text-slate-50 text-lg font-bold mb-4">Notificações</h3>
<label class="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer">
<input checked="" class="w-6 h-6 text-primary border-slate-300 rounded focus:ring-primary" type="checkbox"/>
<div class="flex-1">
<p class="text-[#0d141b] dark:text-slate-50 text-base font-semibold leading-none mb-1">Aviso de saldo baixo</p>
<p class="text-slate-500 text-sm">Receba alertas quando o saldo estiver abaixo de R$ 10,00</p>
</div>
</label>
</div>
</main>
<!-- Bottom Navigation Tabs -->
<nav class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/90 dark:bg-slate-900/90 ios-blur border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex justify-between items-center z-50">
<div class="flex flex-col items-center gap-1 text-slate-400">
<span class="material-symbols-outlined">home</span>
<span class="text-[10px] font-medium">Início</span>
</div>
<div class="flex flex-col items-center gap-1 text-slate-400">
<span class="material-symbols-outlined">account_balance_wallet</span>
<span class="text-[10px] font-medium">Carteira</span>
</div>
<div class="flex flex-col items-center gap-1 text-primary">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">settings</span>
<span class="text-[10px] font-bold">Ajustes</span>
</div>
<div class="flex flex-col items-center gap-1 text-slate-400">
<span class="material-symbols-outlined">contact_support</span>
<span class="text-[10px] font-medium">Ajuda</span>
</div>
</nav>
</div>
</body></html>

<!-- Merenda IQ Modal -->
<!DOCTYPE html>

<html class="light" lang="pt-br"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Merenda IQ Modal</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#f9570b",
                        "background-light": "#f8f6f5",
                        "background-dark": "#23150f",
                    },
                    fontFamily: {
                        "display": ["Inter", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.5rem",
                        "lg": "1rem",
                        "xl": "1.5rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark font-display antialiased h-screen overflow-hidden">
<!-- Backdrop Blur with placeholder app content underneath -->
<div class="absolute inset-0 z-0 flex flex-col p-4 opacity-40">
<div class="h-12 w-full bg-white rounded-lg mb-4"></div>
<div class="grid grid-cols-2 gap-4">
<div class="h-32 bg-white rounded-xl"></div>
<div class="h-32 bg-white rounded-xl"></div>
</div>
<div class="h-64 w-full bg-white rounded-xl mt-4"></div>
</div>
<!-- Modal Backdrop Overlay -->
<div class="fixed inset-0 bg-[#141414]/60 backdrop-blur-sm z-10 flex flex-col justify-end">
<!-- Bottom Sheet Modal (Slide up 70%) -->
<div class="bg-white dark:bg-background-dark rounded-t-xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
<!-- BottomSheetHandle -->
<div class="flex flex-col items-center pt-3 pb-1">
<div class="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
</div>
<!-- TopAppBar -->
<div class="flex items-center px-6 py-2 justify-between">
<h2 class="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-tight">Merenda IQ</h2>
<button class="flex items-center justify-center rounded-full h-10 w-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
<span class="material-symbols-outlined" data-icon="close">close</span>
</button>
</div>
<!-- Tabs (Days of the week) -->
<div class="px-4 border-b border-gray-100 dark:border-gray-800">
<div class="flex justify-between">
<a class="flex flex-col items-center justify-center border-b-[3px] border-primary text-primary pb-3 pt-4 flex-1" href="#">
<p class="text-sm font-bold tracking-wide">Seg</p>
</a>
<a class="flex flex-col items-center justify-center border-b-[3px] border-transparent text-gray-500 dark:text-gray-400 pb-3 pt-4 flex-1" href="#">
<p class="text-sm font-bold tracking-wide">Ter</p>
</a>
<a class="flex flex-col items-center justify-center border-b-[3px] border-transparent text-gray-500 dark:text-gray-400 pb-3 pt-4 flex-1" href="#">
<p class="text-sm font-bold tracking-wide">Qua</p>
</a>
<a class="flex flex-col items-center justify-center border-b-[3px] border-transparent text-gray-500 dark:text-gray-400 pb-3 pt-4 flex-1" href="#">
<p class="text-sm font-bold tracking-wide">Qui</p>
</a>
<a class="flex flex-col items-center justify-center border-b-[3px] border-transparent text-gray-500 dark:text-gray-400 pb-3 pt-4 flex-1" href="#">
<p class="text-sm font-bold tracking-wide">Sex</p>
</a>
</div>
</div>
<!-- Scrollable Content -->
<div class="flex-1 overflow-y-auto p-4 space-y-4 pb-12">
<!-- Card (Main Course) -->
<div class="@container">
<div class="flex flex-col items-stretch justify-start rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
<div class="w-full bg-center bg-no-repeat aspect-[16/9] bg-cover" data-alt="Prato de arroz feijão e frango grelhado bem servido" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCwjzl_5gILHiduPP7wCSOaMnY-1KgR5pE0schLdyOeexN1vqgmg2VO8VDkgc0Io-jNipRBYVZXOB8DlXHvDSMFB9Nctiw-oEURh0u9bqshjw3-w3kzd1askdH7cqgbHWBBetOyV0W--1ML8YlCmpHHKlNMSs-9wrf1p5JQzkIl2PIf06VUnXcE5m9kd-hL6155bk8Lm8veasWAHLOM_9xbrw02HdjBvpjXZP1JkiVK8riQuffFc84XIsm2cRLaNICCNvgKJPS7lhQ");'>
</div>
<div class="flex flex-col gap-1 p-5">
<p class="text-gray-900 dark:text-white text-xl font-bold leading-tight">Arroz, Feijão e Frango</p>
<div class="flex items-end gap-3 justify-between">
<p class="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">Prato equilibrado com temperos naturais e frango grelhado na hora.</p>
</div>
</div>
</div>
</div>
<!-- Stats (Nutritional Info) -->
<div class="flex gap-4">
<div class="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-5 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
<div class="flex items-center gap-2 text-primary">
<span class="material-symbols-outlined text-sm" data-icon="local_fire_department">local_fire_department</span>
<p class="text-sm font-medium leading-normal">Calorias</p>
</div>
<p class="text-gray-900 dark:text-white tracking-tight text-2xl font-bold leading-tight">450 kcal</p>
</div>
<div class="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-5 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
<div class="flex items-center gap-2 text-primary">
<span class="material-symbols-outlined text-sm" data-icon="fitness_center">fitness_center</span>
<p class="text-sm font-medium leading-normal">Proteínas</p>
</div>
<p class="text-gray-900 dark:text-white tracking-tight text-2xl font-bold leading-tight">25g</p>
</div>
</div>
<!-- Secondary Info Section -->
<div class="p-4 bg-primary/10 rounded-xl border border-primary/20">
<div class="flex items-start gap-3">
<span class="material-symbols-outlined text-primary" data-icon="info">info</span>
<div>
<p class="text-gray-900 dark:text-white font-bold text-sm">Dica da Nutri</p>
<p class="text-gray-600 dark:text-gray-300 text-sm mt-1 leading-relaxed">Este prato é rico em fibras e proteínas de alto valor biológico, essencial para o crescimento e energia escolar.</p>
</div>
</div>
</div>
</div>
<!-- Action Button -->
<div class="p-4 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800">
<button class="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                    Ver detalhes completos
                    <span class="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
</div>
</div>
</body></html>

<!-- Cart and Checkout -->
<!DOCTYPE html>

<html class="light" lang="pt-br"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Cart and Checkout - Ambra Food</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#f9570b",
                        "background-light": "#f8f6f5",
                        "background-dark": "#23150f",
                    },
                    fontFamily: {
                        "display": ["Plus Jakarta Sans", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        body {
            font-family: "Plus Jakarta Sans", sans-serif;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark text-[#1c120d] dark:text-white antialiased">
<div class="relative flex h-screen w-full flex-col max-w-[430px] mx-auto overflow-hidden border-x border-gray-100 dark:border-gray-800">
<!-- TopAppBar -->
<header class="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
<div class="text-primary flex size-12 shrink-0 items-center justify-start cursor-pointer">
<span class="material-symbols-outlined text-[28px]">chevron_left</span>
</div>
<h2 class="text-[#1c120d] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Carrinho</h2>
<div class="size-12"></div> <!-- Spacer for centering -->
</header>
<!-- Main Content Area -->
<main class="flex-1 overflow-y-auto px-4 pb-32">
<div class="h-4"></div>
<!-- List Items -->
<div class="space-y-4">
<!-- Suco Natural -->
<div class="flex items-center gap-4 bg-white dark:bg-[#2d1e18] p-4 rounded-xl shadow-sm justify-between">
<div class="flex items-center gap-4">
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16" data-alt="A refreshing bottle of orange juice" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBj8hnTPmOkRwA3u5sYZybcAUqXNtd2W2IBb73CE0-pN9o9v6_1-LiQfWuK-WFTeGTK6xENX9bOXTQxsV71FWlC-2RFHMYweGlLvxAqXHzW2VXSQv8CcdgjGUQLR8QP90hJnh5Oz07HAExFUoKlt0Xxvccoswgw74bDVlzvlXO2sh-Xj7rWOVqIvHcGj9KS9sdBB4aY9fTYqbl9B_JJTaAYoW7_4Ju_ncn4gtEZ9k8mqJ8hCCbArum18HG77fh82ucxrZ6y0uqidJI");'>
</div>
<div class="flex flex-col justify-center">
<p class="text-[#1c120d] dark:text-white text-base font-semibold leading-normal line-clamp-1">Suco Natural</p>
<p class="text-[#9e6347] dark:text-orange-200/70 text-sm font-normal leading-normal line-clamp-2">R$ 5,00</p>
</div>
</div>
<div class="flex flex-col items-end gap-2">
<span class="material-symbols-outlined text-gray-400 text-xl cursor-pointer hover:text-red-500">delete</span>
<div class="shrink-0">
<div class="flex items-center gap-3 text-[#1c120d] dark:text-white">
<button class="text-primary flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 cursor-pointer">
<span class="material-symbols-outlined text-sm font-bold">remove</span>
</button>
<input class="text-base font-bold w-6 p-0 text-center bg-transparent border-none focus:ring-0" readonly="" type="number" value="1"/>
<button class="text-primary flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 cursor-pointer">
<span class="material-symbols-outlined text-sm font-bold">add</span>
</button>
</div>
</div>
</div>
</div>
<!-- Pão de Queijo -->
<div class="flex items-center gap-4 bg-white dark:bg-[#2d1e18] p-4 rounded-xl shadow-sm justify-between">
<div class="flex items-center gap-4">
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16" data-alt="Traditional Brazilian cheese bread rolls" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuC42gHZVWe5TMjA75m63z4Ykg3zHxUEbwQ6WG3Sb37Cof0RFe4ptXDiU4minv4nD_EAtwLiz6HhiTob5VIpDTu9d1lsFs7vaGERDKm8KLasjVxs8X_PgdDLtBXjo_sl_y-Prx3qr9-3FHcIeZqR5t0-4B5MgO7Zhkl8jXgHtRu5W-hk_vHaSbSGv-bUF1Vrl1IdgmWeCVQL4VOKLzEQRABTkCLs5manVcLi0UPFPP0u6pTvGx0fNERlS8eAQ59dRkdnhn41ckgwLdw");'>
</div>
<div class="flex flex-col justify-center">
<p class="text-[#1c120d] dark:text-white text-base font-semibold leading-normal line-clamp-1">Pão de Queijo</p>
<p class="text-[#9e6347] dark:text-orange-200/70 text-sm font-normal leading-normal line-clamp-2">R$ 3,50</p>
</div>
</div>
<div class="flex flex-col items-end gap-2">
<span class="material-symbols-outlined text-gray-400 text-xl cursor-pointer hover:text-red-500">delete</span>
<div class="shrink-0">
<div class="flex items-center gap-3 text-[#1c120d] dark:text-white">
<button class="text-primary flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 cursor-pointer">
<span class="material-symbols-outlined text-sm font-bold">remove</span>
</button>
<input class="text-base font-bold w-6 p-0 text-center bg-transparent border-none focus:ring-0" readonly="" type="number" value="1"/>
<button class="text-primary flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 cursor-pointer">
<span class="material-symbols-outlined text-sm font-bold">add</span>
</button>
</div>
</div>
</div>
</div>
</div>
<!-- DescriptionList / Order Summary -->
<div class="mt-8 p-4 bg-white dark:bg-[#2d1e18] rounded-xl border border-gray-100 dark:border-white/5">
<div class="flex justify-between gap-x-6 py-2">
<p class="text-[#9e6347] dark:text-orange-200/70 text-base font-normal leading-normal">Subtotal</p>
<p class="text-[#1c120d] dark:text-white text-base font-medium leading-normal text-right">R$ 8,50</p>
</div>
<div class="flex justify-between items-center gap-x-6 py-4 mt-2 border-t border-gray-50 dark:border-white/5">
<p class="text-primary text-lg font-bold leading-normal">Total</p>
<p class="text-primary text-xl font-bold leading-normal text-right">R$ 8,50</p>
</div>
</div>
</main>
<!-- Bottom Action & Navigation -->
<div class="fixed bottom-0 w-full max-w-[430px] bg-background-light dark:bg-background-dark pb-safe">
<!-- Checkout Button -->
<div class="px-4 py-4">
<button class="flex w-full cursor-pointer items-center justify-center rounded-full h-14 px-5 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all">
<span class="truncate">Finalizar Pedido</span>
</button>
</div>
<!-- Bottom Navigation Tabs -->
<nav class="flex justify-around items-center h-16 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#2d1e18] px-2">
<div class="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
<span class="material-symbols-outlined text-2xl">home</span>
<span class="text-[10px] font-medium uppercase tracking-wider">Início</span>
</div>
<div class="flex flex-col items-center justify-center gap-1 text-primary">
<span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">shopping_cart</span>
<span class="text-[10px] font-medium uppercase tracking-wider">Carrinho</span>
</div>
<div class="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
<span class="material-symbols-outlined text-2xl">account_balance_wallet</span>
<span class="text-[10px] font-medium uppercase tracking-wider">Carteira</span>
</div>
<div class="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
<span class="material-symbols-outlined text-2xl">person</span>
<span class="text-[10px] font-medium uppercase tracking-wider">Perfil</span>
</div>
</nav>
<div class="h-4 bg-white dark:bg-[#2d1e18]"></div> <!-- Bottom spacer for home indicator -->
</div>
</div>
</body></html>

<!-- Login Screen (v2) -->
<!DOCTYPE html>

<html class="light" lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Ambra Food - Login</title>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#f9570b",
                        "background-light": "#fcf9f8",
                        "background-dark": "#23150f",
                    },
                    fontFamily: {
                        "display": ["Plus Jakarta Sans", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.5rem",
                        "lg": "1rem",
                        "xl": "1.5rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        body {
            font-family: "Plus Jakarta Sans", sans-serif;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center">
<div class="relative flex h-full min-h-screen w-full max-w-[480px] flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
<!-- Top App Bar (iOS Style spacer) -->
<div class="flex items-center p-4 pb-2 justify-end">
<span class="material-symbols-outlined text-[#1c120d] dark:text-white">more_horiz</span>
</div>
<!-- Profile/Logo Header -->
<div class="flex p-4 mt-4 @container">
<div class="flex w-full flex-col gap-4 items-center">
<div class="flex gap-4 flex-col items-center">
<!-- Logo Container -->
<div class="bg-primary rounded-full min-h-32 w-32 flex items-center justify-center shadow-lg shadow-primary/20">
<span class="material-symbols-outlined text-white text-6xl">wallet</span>
</div>
<div class="flex flex-col items-center justify-center">
<h1 class="text-[#1c120d] dark:text-white text-[28px] font-extrabold leading-tight tracking-tight text-center">Ambra Food</h1>
<p class="text-primary text-base font-semibold leading-normal text-center tracking-wide uppercase">Cantina Digital</p>
</div>
</div>
</div>
</div>
<!-- Tabs -->
<div class="mt-6">
<div class="flex border-b border-[#e9d6ce] dark:border-[#3d2a22] px-4 justify-between">
<a class="flex flex-col items-center justify-center border-b-[3px] border-b-primary text-[#1c120d] dark:text-white pb-[13px] pt-4 flex-1" href="#">
<p class="text-sm font-bold leading-normal tracking-wide">Aluno</p>
</a>
<a class="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#9e6347] dark:text-[#a38c82] pb-[13px] pt-4 flex-1" href="#">
<p class="text-sm font-bold leading-normal tracking-wide">Responsável</p>
</a>
</div>
</div>
<!-- Form Fields -->
<div class="flex flex-col gap-2 px-4 py-6">
<!-- Email/CPF Field -->
<div class="flex flex-col w-full">
<p class="text-[#1c120d] dark:text-white text-base font-semibold leading-normal pb-2">E-mail ou CPF</p>
<div class="flex w-full items-center rounded-xl border border-[#e9d6ce] dark:border-[#3d2a22] bg-white dark:bg-[#2d1d16] h-12">
<span class="material-symbols-outlined ml-4 text-[#9e6347]">person</span>
<input class="flex-1 border-0 bg-transparent focus:ring-0 text-[#1c120d] dark:text-white placeholder:text-[#9e6347]/60 p-3 text-base font-normal" placeholder="Insira seu e-mail ou CPF" type="text"/>
</div>
</div>
<!-- Password Field -->
<div class="flex flex-col w-full mt-4">
<p class="text-[#1c120d] dark:text-white text-base font-semibold leading-normal pb-2">Senha</p>
<div class="flex w-full items-stretch rounded-xl border border-[#e9d6ce] dark:border-[#3d2a22] bg-white dark:bg-[#2d1d16] h-12">
<span class="material-symbols-outlined flex items-center ml-4 text-[#9e6347]">lock</span>
<input class="flex-1 border-0 bg-transparent focus:ring-0 text-[#1c120d] dark:text-white placeholder:text-[#9e6347]/60 p-3 text-base font-normal" placeholder="Insira sua senha" type="password"/>
<button class="flex items-center justify-center pr-4 text-[#9e6347]">
<span class="material-symbols-outlined">visibility</span>
</button>
</div>
</div>
</div>
<!-- Primary Action Button -->
<div class="px-4 py-2">
<button class="flex w-full h-12 items-center justify-center rounded-xl bg-primary text-white text-base font-bold tracking-wide transition-all active:scale-[0.98]">
                Entrar
            </button>
</div>
<!-- Forgot Password Link -->
<div class="flex justify-center py-4">
<a class="text-primary text-sm font-bold hover:underline" href="#">Esqueci minha senha</a>
</div>
<!-- Spacer for push -->
<div class="flex-grow"></div>
<!-- Footer Info -->
<div class="flex flex-col items-center gap-4 p-6 mt-auto">
<p class="text-[#9e6347] dark:text-[#a38c82] text-sm font-normal">
                Não possui uma conta? <a class="text-primary font-bold" href="#">Cadastre-se</a>
</p>
<div class="w-1/3 h-1 bg-[#1c120d]/10 dark:bg-white/10 rounded-full mb-2"></div>
</div>
</div>
</body></html>