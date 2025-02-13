import { SCORE_RANGE } from '../../types/feedback';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const ScoreChart = ({ data }: { data: any[] }) => {
  const options = {
    scales: {
      y: {
        beginAtZero: true,
        max: SCORE_RANGE.MAX,
        ticks: {
          stepSize: 2,
          callback: function(tickValue: string | number, _index: number) {
            return `${tickValue}/10`;
          }
        }
      }
    }
  };

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      label: 'Scores',
      data: data.map(d => d.value),
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      borderColor: 'rgb(99, 102, 241)',
      borderWidth: 1
    }]
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default ScoreChart; 