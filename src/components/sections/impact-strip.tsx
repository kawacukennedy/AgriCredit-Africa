export function ImpactStrip() {
  const metrics = [
    { label: 'Farmers Funded', value: '1,250+' },
    { label: 'Loans Disbursed', value: '$2.5M+' },
    { label: 'Carbon Credits', value: '50,000+' },
    { label: 'Countries', value: '5' },
  ];

  return (
    <section className="bg-agri-green text-white py-8">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {metrics.map((metric, index) => (
            <div key={index}>
              <div className="text-2xl md:text-3xl font-bold">{metric.value}</div>
              <div className="text-sm opacity-90">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}