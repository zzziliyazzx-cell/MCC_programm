import React, { useEffect, useState } from 'react';

interface Aircraft {
  id: number;
  tail_number: string;
  model: string;
  current_status: string;
  start_time: string; // из status_history
  description: string; // из status_history
}

const AogTable: React.FC = () => {
  const [aogAircraft, setAogAircraft] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);

  useEffect(() => {
    const fetchAogAircraft = async () => {
      try {
        const response = await fetch('YOUR_BACKEND_URL/api/aircraft/aog');
        const data = await response.json();
        setAogAircraft(data);
      } catch (error) {
        console.error('Ошибка загрузки данных AOG:', error);
      }
    };
    fetchAogAircraft();
  }, []);

  const handleRowClick = async (aircraftId: number) => {
    try {
      const response = await fetch(`YOUR_BACKEND_URL/api/aircraft/${aircraftId}`);
      const data = await response.json();
      setSelectedAircraft(data.aircraft); // Упрощенно, нужно передать все данные в модальное окно
      // Здесь мы откроем модальное окно с компонентом AircraftCard
    } catch (error) {
      console.error('Ошибка загрузки данных ВС:', error);
    }
  };

  return (
    <div>
      <h1>ВС в состоянии AOG (Aircraft on Ground)</h1>
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>Бортовой номер</th>
            <th>Модель</th>
            <th>Время начала AOG</th>
            <th>Причина</th>
          </tr>
        </thead>
        <tbody>
          {aogAircraft.map(aircraft => (
            <tr key={aircraft.id} onClick={() => handleRowClick(aircraft.id)} style={{cursor: 'pointer'}}>
              <td>{aircraft.tail_number}</td>
              <td>{aircraft.model}</td>
              <td>{new Date(aircraft.start_time).toLocaleString()}</td>
              <td>{aircraft.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Модальное окно для отображения карточки ВС */}
      {selectedAircraft && (
        <AircraftCard
          aircraftId={selectedAircraft.id}
          onClose={() => setSelectedAircraft(null)}
        />
      )}
    </div>
  );
};

export default AogTable;
