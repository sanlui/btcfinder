document.addEventListener('DOMContentLoaded', function() {
  const chartContainer = document.getElementById('tradingview-chart');
  
  // 1. Inizializzazione grafico
  const chart = LightweightCharts.createChart(chartContainer, {
    layout: {
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface'),
      textColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
    },
    grid: {
      vertLines: {
        color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid'),
      },
      horzLines: {
        color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid'),
      },
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
    },
    rightPriceScale: {
      borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border'),
    },
    timeScale: {
      borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border'),
    },
    width: chartContainer.clientWidth,
    height: 400,
  });

  // 2. Aggiungi serie di dati
  const candleSeries = chart.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  });

  // 3. Esempio dati (sostituire con dati reali da API)
  const initialData = [
    { time: '2023-01-01', open: 16500, high: 16600, low: 16400, close: 16550 },
    { time: '2023-01-02', open: 16550, high: 16700, low: 16500, close: 16650 },
    // Aggiungi altri dati...
  ];
  
  candleSeries.setData(initialData);

  // 4. Aggiornamento in tempo reale (esempio)
  function simulateRealTime() {
    const now = new Date();
    const time = now.toISOString().split('T')[0];
    const lastClose = initialData[initialData.length - 1].close;
    const newPrice = lastClose * (1 + (Math.random() * 0.02 - 0.01));
    
    candleSeries.update({
      time,
      open: lastClose,
      high: newPrice > lastClose ? newPrice : lastClose,
      low: newPrice < lastClose ? newPrice : lastClose,
      close: newPrice,
    });
  }

  // Simula aggiornamento ogni 5 secondi
  setInterval(simulateRealTime, 5000);

  // 5. Cambio timeframe
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Qui dovresti fare una chiamata API per ottenere i dati del nuovo timeframe
      console.log('Cambiato timeframe:', this.dataset.timeframe);
    });
  });

  // 6. Responsive
  window.addEventListener('resize', function() {
    chart.applyOptions({
      width: chartContainer.clientWidth,
    });
  });
});
