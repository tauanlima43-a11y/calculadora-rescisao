"use client";

import { useState } from "react";
import { Calculator, AlertCircle, TrendingUp, MessageCircle, FileText, CheckCircle, BarChart3, Shield } from "lucide-react";
import jsPDF from "jspdf";

interface FormData {
  salarioBruto: string;
  saldoFGTS: string;
  dataAdmissao: string;
  dataSaida: string;
  motivoSaida: string;
}

interface Calculo {
  pedirDemissao: {
    saldoSalario: number;
    decimoTerceiro: number;
    ferias: number;
    avisoPrevi: number;
    multaFGTS: number;
    saqueFGTS: number;
    total: number;
  };
  rescisaoIndireta: {
    saldoSalario: number;
    decimoTerceiro: number;
    ferias: number;
    avisoPrevi: number;
    multaFGTS: number;
    saqueFGTS: number;
    total: number;
  };
  diferenca: number;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    salarioBruto: "",
    saldoFGTS: "",
    dataAdmissao: "",
    dataSaida: new Date().toISOString().split("T")[0],
    motivoSaida: "",
  });

  const [resultado, setResultado] = useState<Calculo | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);

  const calcularRescisao = () => {
    const salario = parseFloat(formData.salarioBruto) || 0;
    const fgts = parseFloat(formData.saldoFGTS) || 0;
    const admissao = new Date(formData.dataAdmissao);
    const saida = new Date(formData.dataSaida);

    // Cálculo de tempo de casa
    const diffTime = Math.abs(saida.getTime() - admissao.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const anosCompletos = Math.floor(diffDays / 365);
    const mesesTrabalhados = Math.floor((diffDays % 365) / 30);

    // Meses trabalhados no ano corrente para 13º
    const inicioAno = new Date(saida.getFullYear(), 0, 1);
    const diffAno = Math.abs(saida.getTime() - inicioAno.getTime());
    const mesesAnoCorrente = Math.min(12, Math.ceil(diffAno / (1000 * 60 * 60 * 24 * 30)));

    // Cálculos comuns
    const saldoSalario = salario; // Simplificado: 1 mês
    const decimoTerceiro = (salario / 12) * mesesAnoCorrente;
    
    // Férias
    let ferias = 0;
    if (anosCompletos >= 1) {
      // 1 período vencido + proporcionais
      ferias = salario + (salario / 12) * mesesTrabalhados;
    } else {
      // Apenas proporcionais
      ferias = (salario / 12) * mesesTrabalhados;
    }
    ferias = ferias * 1.33; // + 1/3

    // Aviso Prévio (apenas rescisão indireta)
    const diasAvisoPrevi = 30 + (anosCompletos * 3);
    const avisoPrevi = (salario / 30) * diasAvisoPrevi;

    // Multa FGTS 40% (apenas rescisão indireta)
    const multaFGTS = fgts * 0.4;

    // Cenário A: Pedir Demissão
    const pedirDemissao = {
      saldoSalario,
      decimoTerceiro,
      ferias,
      avisoPrevi: 0,
      multaFGTS: 0,
      saqueFGTS: 0,
      total: saldoSalario + decimoTerceiro + ferias,
    };

    // Cenário B: Rescisão Indireta
    const rescisaoIndireta = {
      saldoSalario,
      decimoTerceiro,
      ferias,
      avisoPrevi,
      multaFGTS,
      saqueFGTS: fgts,
      total: saldoSalario + decimoTerceiro + ferias + avisoPrevi + multaFGTS + fgts,
    };

    const diferenca = rescisaoIndireta.total - pedirDemissao.total;

    setResultado({
      pedirDemissao,
      rescisaoIndireta,
      diferenca,
    });

    setMostrarResultado(true);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    const d = new Date(data);
    return d.toLocaleDateString("pt-BR");
  };

  const gerarMensagemWhatsApp = () => {
    if (!resultado) return "";
    
    const mensagem = `Olá! Utilizei o simulador de rescisão trabalhista e gostaria de uma análise detalhada do meu caso.

📊 *Dados Informados:*
• Salário: ${formatarMoeda(parseFloat(formData.salarioBruto))}
• FGTS: ${formatarMoeda(parseFloat(formData.saldoFGTS))}
• Situação: ${formData.motivoSaida}

💼 *Valores Estimados:*
• Pedido de Demissão: ${formatarMoeda(resultado.pedirDemissao.total)}
• Rescisão Indireta: ${formatarMoeda(resultado.rescisaoIndireta.total)}
• Diferença: ${formatarMoeda(resultado.diferenca)}

Gostaria de agendar uma consulta para avaliar minha situação.`;

    return encodeURIComponent(mensagem);
  };

  const handleWhatsApp = () => {
    const numero = "5511999999999"; // Substitua pelo número real
    const mensagem = gerarMensagemWhatsApp();
    window.open(`https://wa.me/${numero}?text=${mensagem}`, "_blank");
  };

  const gerarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Função auxiliar para adicionar texto centralizado
    const addCenteredText = (text: string, y: number, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    // Função auxiliar para adicionar linha
    const addLine = (y: number) => {
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, pageWidth - 20, y);
    };

    // Cabeçalho
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    addCenteredText("MEMÓRIA DE CÁLCULO", 15, 18, true);
    addCenteredText("Comparativo de Modalidades de Rescisão Trabalhista", 25, 12);
    
    doc.setTextColor(0, 0, 0);
    yPosition = 50;

    // Data de emissão
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 20, yPosition);
    yPosition += 10;

    // Seção: Dados Informados
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition, pageWidth - 40, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS INFORMADOS", 25, yPosition + 5.5);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Salário Bruto Mensal: ${formatarMoeda(parseFloat(formData.salarioBruto))}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Saldo do FGTS: ${formatarMoeda(parseFloat(formData.saldoFGTS))}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Data de Admissão: ${formatarData(formData.dataAdmissao)}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Data de Saída Prevista: ${formatarData(formData.dataSaida)}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Contexto da Situação: ${formData.motivoSaida}`, 25, yPosition);
    yPosition += 12;

    // Seção: Cenário A - Pedido de Demissão
    doc.setFillColor(220, 220, 220);
    doc.rect(20, yPosition, pageWidth - 40, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CENÁRIO A: PEDIDO DE DEMISSÃO", 25, yPosition + 5.5);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Verbas Devidas:", 25, yPosition);
    yPosition += 7;

    doc.setFont("helvetica", "normal");
    doc.text(`Saldo de Salário:`, 30, yPosition);
    doc.text(formatarMoeda(resultado.pedirDemissao.saldoSalario), pageWidth - 60, yPosition);
    yPosition += 6;
    doc.text(`13º Proporcional:`, 30, yPosition);
    doc.text(formatarMoeda(resultado.pedirDemissao.decimoTerceiro), pageWidth - 60, yPosition);
    yPosition += 6;
    doc.text(`Férias + 1/3 Constitucional:`, 30, yPosition);
    doc.text(formatarMoeda(resultado.pedirDemissao.ferias), pageWidth - 60, yPosition);
    yPosition += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Verbas Não Devidas:", 25, yPosition);
    yPosition += 7;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`Aviso Prévio Indenizado:`, 30, yPosition);
    doc.text("—", pageWidth - 60, yPosition);
    yPosition += 6;
    doc.text(`Multa 40% FGTS:`, 30, yPosition);
    doc.text("—", pageWidth - 60, yPosition);
    yPosition += 6;
    doc.text(`Saque FGTS:`, 30, yPosition);
    doc.text("Indisponível", pageWidth - 60, yPosition);
    yPosition += 10;

    doc.setTextColor(0, 0, 0);
    addLine(yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL ESTIMADO:", 25, yPosition);
    doc.text(formatarMoeda(resultado.pedirDemissao.total), pageWidth - 60, yPosition);
    yPosition += 15;

    // Seção: Cenário B - Rescisão Indireta
    doc.setFillColor(45, 80, 22);
    doc.rect(20, yPosition, pageWidth - 40, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CENÁRIO B: RESCISÃO INDIRETA", 25, yPosition + 5.5);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("(Justa Causa do Empregador)", 25, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Verbas Devidas (Estimativa):", 25, yPosition);
    yPosition += 7;

    doc.setFont("helvetica", "normal");
    doc.text(`Saldo de Salário:`, 30, yPosition);
    doc.text(formatarMoeda(resultado.rescisaoIndireta.saldoSalario), pageWidth - 60, yPosition);
    yPosition += 6;
    doc.text(`13º Proporcional:`, 30, yPosition);
    doc.text(formatarMoeda(resultado.rescisaoIndireta.decimoTerceiro), pageWidth - 60, yPosition);
    yPosition += 6;
    doc.text(`Férias + 1/3 Constitucional:`, 30, yPosition);
    doc.text(formatarMoeda(resultado.rescisaoIndireta.ferias), pageWidth - 60, yPosition);
    yPosition += 10;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(45, 80, 22);
    doc.text("Verbas Adicionais:", 25, yPosition);
    yPosition += 7;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`Aviso Prévio Indenizado:`, 30, yPosition);
    doc.setTextColor(45, 80, 22);
    doc.setFont("helvetica", "bold");
    doc.text(formatarMoeda(resultado.rescisaoIndireta.avisoPrevi), pageWidth - 60, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    yPosition += 6;
    doc.text(`Multa 40% FGTS:`, 30, yPosition);
    doc.setTextColor(45, 80, 22);
    doc.setFont("helvetica", "bold");
    doc.text(formatarMoeda(resultado.rescisaoIndireta.multaFGTS), pageWidth - 60, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    yPosition += 6;
    doc.text(`Saque FGTS:`, 30, yPosition);
    doc.setTextColor(45, 80, 22);
    doc.setFont("helvetica", "bold");
    doc.text(formatarMoeda(resultado.rescisaoIndireta.saqueFGTS), pageWidth - 60, yPosition);
    yPosition += 10;

    doc.setTextColor(0, 0, 0);
    addLine(yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL ESTIMADO:", 25, yPosition);
    doc.setTextColor(45, 80, 22);
    doc.text(formatarMoeda(resultado.rescisaoIndireta.total), pageWidth - 60, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    // Seção: Diferença
    doc.setFillColor(30, 58, 95);
    doc.rect(20, yPosition, pageWidth - 40, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    addCenteredText("DIFERENÇA ESTIMADA ENTRE MODALIDADES", yPosition + 8, 11, true);
    doc.setFontSize(16);
    addCenteredText(formatarMoeda(resultado.diferenca), yPosition + 16, 16, true);
    yPosition += 30;

    // Disclaimer
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(255, 243, 205);
    doc.rect(20, yPosition, pageWidth - 40, 35, "F");
    doc.setDrawColor(245, 158, 11);
    doc.rect(20, yPosition, pageWidth - 40, 35, "S");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("AVISO LEGAL IMPORTANTE", 25, yPosition + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const disclaimerText = "Esta ferramenta é um simulador para fins meramente informativos e não substitui consulta jurídica. Os valores são estimativas e podem variar conforme Convenções Coletivas, acordos individuais e análise probatória do caso concreto. A caracterização de rescisão indireta depende de comprovação judicial das faltas graves do empregador. Consulte um advogado trabalhista para avaliação precisa da sua situação.";
    const splitText = doc.splitTextToSize(disclaimerText, pageWidth - 50);
    doc.text(splitText, 25, yPosition + 12);

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Documento gerado automaticamente pelo Simulador de Rescisão Trabalhista", pageWidth / 2, pageHeight - 10, { align: "center" });

    // Salvar PDF
    doc.save(`Memoria_Calculo_Rescisao_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900 font-inter">
      {/* Header Redesenhado */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#2c5282] to-[#1e3a5f]">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Badge superior */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Ferramenta Profissional de Análise</span>
            </div>
          </div>

          {/* Título principal */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Comparativo de Modalidades
              <span className="block mt-2 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                de Rescisão Trabalhista
              </span>
            </h1>
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="h-1 w-16 bg-gradient-to-r from-transparent to-white/50 rounded-full"></div>
              <BarChart3 className="w-8 h-8 text-white" />
              <div className="h-1 w-16 bg-gradient-to-l from-transparent to-white/50 rounded-full"></div>
            </div>
          </div>

          {/* Subtítulo e descrição */}
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg sm:text-xl text-slate-100 mb-4 leading-relaxed">
              Ferramenta de simulação para análise comparativa de verbas rescisórias trabalhistas
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <Calculator className="w-5 h-5 text-white" />
                <span className="text-sm text-white font-medium">Cálculos Precisos</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="text-sm text-white font-medium">Análise Comparativa</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <Shield className="w-5 h-5 text-white" />
                <span className="text-sm text-white font-medium">Informação Confiável</span>
              </div>
            </div>
          </div>
        </div>

        {/* Onda decorativa inferior */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 sm:h-16" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,80 600,80 900,40 L1200,0 L1200,120 L0,120 Z" fill="rgb(248, 250, 252)" opacity="1"></path>
          </svg>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Formulário */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-xl border border-slate-300 p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-6 h-6 text-[#1e3a5f]" />
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800">Dados para Simulação</h3>
            </div>

            <div className="space-y-5">
              {/* Salário Bruto */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Salário Bruto Mensal (R$)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 3000.00"
                  value={formData.salarioBruto}
                  onChange={(e) => setFormData({ ...formData, salarioBruto: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all text-lg"
                />
              </div>

              {/* Saldo FGTS */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Saldo do FGTS (R$)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 15000.00"
                  value={formData.saldoFGTS}
                  onChange={(e) => setFormData({ ...formData, saldoFGTS: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all text-lg"
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    value={formData.dataAdmissao}
                    onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Data de Saída Prevista
                  </label>
                  <input
                    type="date"
                    value={formData.dataSaida}
                    onChange={(e) => setFormData({ ...formData, dataSaida: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Motivo da Saída */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Contexto da Situação
                </label>
                <select
                  value={formData.motivoSaida}
                  onChange={(e) => setFormData({ ...formData, motivoSaida: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all text-lg"
                >
                  <option value="">Selecione uma opção</option>
                  <option value="Assédio Moral ou Humilhação">Assédio Moral ou Humilhação</option>
                  <option value="Atraso Reiterado de Salário">Atraso Reiterado de Salário</option>
                  <option value="Não Recolhimento de FGTS">Não Recolhimento de FGTS</option>
                  <option value="Desejo de Desligamento Voluntário">Desejo de Desligamento Voluntário</option>
                </select>
              </div>

              {/* Botão Calcular */}
              <button
                onClick={calcularRescisao}
                disabled={!formData.salarioBruto || !formData.saldoFGTS || !formData.dataAdmissao || !formData.motivoSaida}
                className="w-full py-4 bg-[#1e3a5f] hover:bg-[#2c5282] text-white font-bold text-lg rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Calculator className="w-5 h-5" />
                Simular Cenários
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {mostrarResultado && resultado && (
          <div className="space-y-8 animate-fade-in">
            {/* Cards Comparativos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Card A - Pedido de Demissão */}
              <div className="bg-white rounded-xl border-2 border-slate-400 p-6 sm:p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-300">
                  <AlertCircle className="w-7 h-7 text-slate-600" />
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                    Pedido de Demissão
                  </h3>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm text-slate-600 font-semibold mb-4">Verbas Devidas:</p>
                  
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-slate-700">Saldo de Salário</span>
                    <span className="font-semibold text-slate-900">{formatarMoeda(resultado.pedirDemissao.saldoSalario)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-slate-700">13º Proporcional</span>
                    <span className="font-semibold text-slate-900">{formatarMoeda(resultado.pedirDemissao.decimoTerceiro)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-slate-700">Férias + 1/3 Constitucional</span>
                    <span className="font-semibold text-slate-900">{formatarMoeda(resultado.pedirDemissao.ferias)}</span>
                  </div>

                  {/* Verbas Não Devidas */}
                  <div className="mt-6 pt-4 border-t-2 border-slate-300">
                    <p className="text-slate-600 font-semibold mb-3 text-sm">Verbas Não Devidas:</p>
                    <div className="flex justify-between items-center py-2 bg-slate-100 rounded px-3">
                      <span className="text-slate-500">Aviso Prévio Indenizado</span>
                      <span className="text-slate-500 font-semibold">—</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-slate-100 rounded px-3 mt-2">
                      <span className="text-slate-500">Multa 40% FGTS</span>
                      <span className="text-slate-500 font-semibold">—</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-slate-100 rounded px-3 mt-2">
                      <span className="text-slate-500">Saque FGTS</span>
                      <span className="text-slate-500 font-semibold">Indisponível</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-slate-400">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-700">Total Estimado:</span>
                    <span className="text-2xl sm:text-3xl font-bold text-slate-800">
                      {formatarMoeda(resultado.pedirDemissao.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card B - Rescisão Indireta */}
              <div className="bg-white rounded-xl border-2 border-[#2d5016] p-6 sm:p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#2d5016]">
                  <CheckCircle className="w-7 h-7 text-[#2d5016]" />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                      Rescisão Indireta
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">(Justa Causa do Empregador)</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm text-slate-600 font-semibold mb-4">Verbas Devidas (Estimativa):</p>
                  
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-slate-700">Saldo de Salário</span>
                    <span className="font-semibold text-slate-900">{formatarMoeda(resultado.rescisaoIndireta.saldoSalario)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-slate-700">13º Proporcional</span>
                    <span className="font-semibold text-slate-900">{formatarMoeda(resultado.rescisaoIndireta.decimoTerceiro)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-slate-700">Férias + 1/3 Constitucional</span>
                    <span className="font-semibold text-slate-900">{formatarMoeda(resultado.rescisaoIndireta.ferias)}</span>
                  </div>

                  {/* Verbas Adicionais */}
                  <div className="mt-6 pt-4 border-t-2 border-[#2d5016]">
                    <p className="text-[#2d5016] font-semibold mb-3 text-sm">Verbas Adicionais:</p>
                    <div className="flex justify-between items-center py-2 bg-[#f0f7ed] rounded px-3 border border-[#2d5016]/20">
                      <span className="text-slate-700 font-medium">Aviso Prévio Indenizado</span>
                      <span className="text-[#2d5016] font-bold">{formatarMoeda(resultado.rescisaoIndireta.avisoPrevi)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-[#f0f7ed] rounded px-3 mt-2 border border-[#2d5016]/20">
                      <span className="text-slate-700 font-medium">Multa 40% FGTS</span>
                      <span className="text-[#2d5016] font-bold">{formatarMoeda(resultado.rescisaoIndireta.multaFGTS)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-[#f0f7ed] rounded px-3 mt-2 border border-[#2d5016]/20">
                      <span className="text-slate-700 font-medium">Saque FGTS</span>
                      <span className="text-[#2d5016] font-bold">{formatarMoeda(resultado.rescisaoIndireta.saqueFGTS)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-[#2d5016]">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-700">Total Estimado:</span>
                    <span className="text-2xl sm:text-3xl font-bold text-[#2d5016]">
                      {formatarMoeda(resultado.rescisaoIndireta.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box da Diferença */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border-2 border-[#1e3a5f] p-8 sm:p-10 shadow-lg">
              <div className="text-center">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-[#1e3a5f] mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                  Diferença Estimada entre Modalidades
                </h3>
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#1e3a5f] mb-4">
                  {formatarMoeda(resultado.diferenca)}
                </div>
                <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto">
                  Valor adicional estimado na modalidade de Rescisão Indireta em comparação ao Pedido de Demissão
                </p>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="bg-[#1e3a5f] hover:bg-[#2c5282] text-white font-semibold text-base py-5 px-6 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Solicitar Análise Detalhada (WhatsApp)</span>
              </button>

              {/* PDF */}
              <button
                onClick={gerarPDF}
                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold text-base py-5 px-6 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-3"
              >
                <FileText className="w-5 h-5" />
                <span>Baixar Memória de Cálculo (PDF)</span>
              </button>
            </div>

            {/* Disclaimer Obrigatório */}
            <div className="max-w-4xl mx-auto mt-8 p-6 bg-amber-50 rounded-lg border-2 border-amber-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-2">
                    Aviso Legal Importante
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Esta ferramenta é um simulador para fins meramente informativos e não substitui consulta jurídica. 
                    Os valores são estimativas e podem variar conforme Convenções Coletivas, acordos individuais e análise 
                    probatória do caso concreto. A caracterização de rescisão indireta depende de comprovação judicial das 
                    faltas graves do empregador. Consulte um advogado trabalhista para avaliação precisa da sua situação.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-300 bg-slate-100 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-600 text-sm font-medium">
            Simulador de Rescisão Trabalhista - Ferramenta Informativa
          </p>
          <p className="text-slate-500 text-xs mt-2">
            © 2024 - Todos os direitos reservados
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
