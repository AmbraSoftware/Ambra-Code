import React from 'react';

type LegalContentProps = {
    activeTab: 'terms' | 'privacy';
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
};

export default function LegalContent({ activeTab, onScroll }: LegalContentProps) {
    return (
        <div
            className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 scrollbar-hide"
            onScroll={onScroll}
        >
            {activeTab === 'terms' ? (
                <div className="max-w-[800px] mx-auto space-y-8 animate-in fade-in duration-300">
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-light dark:text-text-dark">Termos de Uso e Condições</h1>
                        <div className="flex items-center gap-2 text-muted-light dark:text-muted-dark text-sm font-medium">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            <span>Versão 1.0 - Vigente</span>
                        </div>
                    </div>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">1</span>
                            Aceite e Escopo
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            Ao clicar em "Aceitar e Continuar", o CONTRATANTE (seja Instituição de Ensino ou Operador Independente) adere integralmente a este contrato de licença de software. A Ambra Flow provê uma ferramenta de gestão (SaaS) e intermediação financeira, não sendo fornecedora de produtos alimentícios.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">2</span>
                            Gestão Financeira e Motor de Crédito
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-2">
                            <strong>Intermediação:</strong> A Ambra Flow facilita pagamentos via subcontas. As taxas de serviço serão retidas automaticamente conforme o plano selecionado.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            <strong>Crédito de Emergência:</strong> O sistema permite um teto de crédito (ex: R$ 7,00) para garantir a alimentação do aluno. A responsabilidade pela cobrança e o risco de inadimplência deste valor perante os pais é exclusivo do CONTRATANTE.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">3</span>
                            Limitação de Responsabilidade
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-2">
                            <strong>Indisponibilidade Técnica:</strong> A Ambra Flow não se responsabiliza por lucros cessantes, perda de vendas ou danos decorrentes de interrupções na conexão de internet da unidade escolar, falhas no hardware local ou oscilações de energia.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            <strong>Uso Indevido:</strong> O CONTRATANTE é o único responsável pela veracidade dos dados inseridos, incluindo preços, estoques e alertas de alergias.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">4</span>
                            Direito de Suspensão por Inadimplência
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            <strong>Regra de Bloqueio:</strong> O atraso no pagamento da mensalidade ou das taxas de licenciamento superior a 15 (quinze) dias acarretará a suspensão imediata das funcionalidades de venda e processamento de pedidos na plataforma.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">5</span>
                            Natureza da Relação
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            <strong>Inexistência de Vínculo:</strong> Não existe qualquer tipo de vínculo empregatício, societário ou de subordinação entre a Ambra Flow e os funcionários, operadores ou prepostos da cantina/escola. O software é uma ferramenta de produtividade, e a gestão de RH é de responsabilidade do CONTRATANTE.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">6</span>
                            Rescisão e Cancelamento
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            O cancelamento pode ser feito a qualquer momento, com aviso prévio de 30 dias. Isso evita interrupções abruptas no serviço aos alunos e permite o fechamento contábil adequado.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">7</span>
                            Propriedade Intelectual
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            O código, logos, algoritmos de recomendação e inteligência de dados do Ambra Flow são de propriedade exclusiva da Nodum. O uso da plataforma não confere ao CONTRATANTE qualquer direito de propriedade sobre o software.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">8</span>
                            Foro
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            Fica eleito o foro da comarca de São Vicente/SP para dirimir quaisquer dúvidas ou litígios oriundos deste contrato, com renúncia expressa a qualquer outro.
                        </p>
                    </section>
                </div>
            ) : (
                <div className="max-w-[800px] mx-auto space-y-8 animate-in fade-in duration-300">
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-light dark:text-text-dark">Política de Privacidade</h1>
                        <div className="flex items-center gap-2 text-muted-light dark:text-muted-dark text-sm font-medium">
                            <span className="material-symbols-outlined text-[18px]">verified_user</span>
                            <span>Foco: Segurança e Transparência Bancária</span>
                        </div>
                    </div>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">1</span>
                            Coleta e Papéis na LGPD
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-2">
                            <strong>Controladora:</strong> A Cantina/Escola é a Controladora dos dados dos alunos e pais.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-2">
                            <strong>Operadora:</strong> A Ambra Flow atua como Operadora, processando os dados conforme as instruções do sistema para fins de venda e segurança alimentar.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            <strong>Dados Coletados:</strong> Coletamos dados da entidade (CNPJ/CPF), dados operacionais (vendas/estoque) e dados de alunos (nome, série, saldo e restrições alimentares).
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">2</span>
                            Uso das Informações e Segurança
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-2">
                            <strong>Finalidade:</strong> Os dados são utilizados para processamento financeiro, conciliação de vendas e controle de estoque.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            <strong>Segurança de Nível Bancário:</strong> Adotamos criptografia TLS 1.3, Firewall avançado e autenticação em dois fatores (2FA) para proteger o ambiente.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs">3</span>
                            Compartilhamento e Direitos (LGPD)
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-2">
                            <strong>Parceiros:</strong> Os dados são compartilhados apenas com gateways de pagamento (Asaas) e serviços de nuvem sob rigorosos contratos de confidencialidade.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            <strong>Direitos do Titular:</strong> O usuário possui total controle sobre seus dados, podendo solicitar exportação ou correção através do painel administrativo.
                        </p>
                    </section>
                </div>
            )}
        </div>
    );
}
