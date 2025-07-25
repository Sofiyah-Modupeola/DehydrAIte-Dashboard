import React, { useState, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Thermometer, Droplets, Gauge, Leaf, AlertTriangle, Play, Pause, RotateCcw } from 'lucide-react';

// Main App Component
const App = () => {
  const [sensorData, setSensorData] = useState([]);
  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  const [currentDisplayData, setCurrentDisplayData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState(''); // 'warning' or 'error'
  const [currentImage, setCurrentImage] = useState('https://placehold.co/600x400/E0E7FF/000000?text=Loading+Image...'); // Placeholder

  // Image assets - In a real app, you'd dynamically load these or use a CDN
  // For this demo, we'll simulate paths relative to the assumed 'public' folder or similar
  const imageAssets = {
    'Tomato Slices': {
      'fresh': 'https://placehold.co/600x400/FEE2E2/000000?text=Fresh+Tomato',
      'partially_dry': 'https://placehold.co/600x400/FCD34D/000000?text=Partially+Dry+Tomato',
      'fully_dry': 'https://placehold.co/600x400/9CA3AF/000000?text=Dried+Tomato',
      'mold': 'https://placehold.co/600x400/EF4444/FFFFFF?text=Moldy+Tomato+ALERT',
      'discoloration': 'https://placehold.co/600x400/DC2626/FFFFFF?text=Discolored+Tomato+ALERT'
    },
    'Habanero Peppers': {
      'fresh': 'https://placehold.co/600x400/FDBA74/000000?text=Fresh+Habanero',
      'partially_dry': 'https://placehold.co/600x400/FB923C/000000?text=Partially+Dry+Habanero',
      'fully_dry': 'https://placehold.co/600x400/7C2D12/FFFFFF?text=Dried+Habanero',
      'mold': 'https://placehold.co/600x400/EF4444/FFFFFF?text=Moldy+Habanero+ALERT',
      'discoloration': 'https://placehold.co/600x400/DC2626/FFFFFF?text=Discolored+Habanero+ALERT'
    },
    'Onion Slices': {
      'fresh': 'https://placehold.co/600x400/E5E7EB/000000?text=Fresh+Onion',
      'partially_dry': 'https://placehold.co/600x400/D1D5DB/000000?text=Partially+Dry+Onion',
      'fully_dry': 'https://placehold.co/600x400/6B7280/FFFFFF?text=Dried+Onion',
      'mold': 'https://placehold.co/600x400/EF4444/FFFFFF?text=Moldy+Onion+ALERT',
      'discoloration': 'https://placehold.co/600x400/DC2626/FFFFFF?text=Discolored+Onion+ALERT'
    }
  };

  // Function to get image path based on dryness and produce type
  const getSimulatedImagePath = useCallback((data) => {
    if (!data || !data.Produce_Type) return imageAssets['Tomato Slices']['fresh']; // Default
    const type = data.Produce_Type;
    const dryness = data.Dryness_PCT;
    const anomaly = data.Anomaly_Flag;

    if (anomaly === 1) {
      // Simulate specific anomaly types based on produce type for visual demo
      if (type === 'Tomato Slices') return imageAssets[type]['mold']; // Or 'discoloration'
      if (type === 'Habanero Peppers') return imageAssets[type]['discoloration'];
      if (type === 'Onion Slices') return imageAssets[type]['mold'];
    }

    if (dryness < 30) return imageAssets[type]['fresh'];
    if (dryness < 70) return imageAssets[type]['partially_dry'];
    return imageAssets[type]['fully_dry'];
  }, [imageAssets]);


  // Data loading effect
  useEffect(() => {
    const loadData = async () => {
      try {
        // Attempt to load tomato data first as a primary demo source
        const response = await fetch('simulated_tomato_drying_data.csv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const parsedData = results.data.filter(row => row.Timestamp); // Filter out incomplete rows
            setSensorData(parsedData);
            if (parsedData.length > 0) {
              setCurrentDisplayData(parsedData[0]);
              setCurrentImage(getSimulatedImagePath(parsedData[0]));
            }
          },
          error: (err) => {
            console.error("CSV parsing error:", err);
            setAlertMessage("Failed to parse sensor data. Check CSV format.");
            setAlertType("error");
          }
        });
      } catch (error) {
        console.error("Failed to load CSV:", error);
        setAlertMessage("Failed to load sensor data. Ensure 'simulated_tomato_drying_data.csv' is in the public folder.");
        setAlertType("error");
      }
    };

    loadData();
  }, [getSimulatedImagePath]);

  // Simulation interval effect
  useEffect(() => {
    if (isPlaying && sensorData.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentDataIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < sensorData.length) {
            const data = sensorData[nextIndex];
            setCurrentDisplayData(data);
            setCurrentImage(getSimulatedImagePath(data));

            // Simulate anomaly alerts based on data
            if (data.Anomaly_Flag === 1) {
              setAlertMessage(`Anomaly Detected! Potential issue with ${data.Produce_Type} drying.`);
              setAlertType("error");
            } else if (data.Humidity_PCT > 80 && data.Dryness_PCT < 20) {
              setAlertMessage("Humidity is high, ensure proper ventilation.");
              setAlertType("warning");
            } else {
              setAlertMessage(""); // Clear alert if conditions normalize
            }
            return nextIndex;
          } else {
            // End of data, stop simulation
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            setAlertMessage("Simulation complete. Data cycle finished.");
            setAlertType("info");
            return prevIndex; // Stay at the last index
          }
        });
      }, 1000); // Update every 1 second (adjust for faster/slower simulation)
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, sensorData, getSimulatedImagePath]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentDataIndex(0);
    if (sensorData.length > 0) {
      setCurrentDisplayData(sensorData[0]);
      setCurrentImage(getSimulatedImagePath(sensorData[0]));
    } else {
      setCurrentDisplayData(null);
    }
    setAlertMessage('');
    setAlertType('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 font-inter text-gray-800 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="bg-white shadow-2xl rounded-xl p-6 sm:p-10 w-full max-w-4xl border border-gray-200">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-700 mb-8 flex items-center justify-center gap-3">
          <Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-green-600"/> DehydrAIte Dashboard
        </h1>

        {alertMessage && (
          <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${
            alertType === 'error' ? 'bg-red-100 text-red-700 border border-red-300' :
            alertType === 'warning' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
            'bg-blue-100 text-blue-700 border border-blue-300'
          }`}>
            <AlertTriangle className="w-5 h-5"/>
            <p className="font-medium">{alertMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Live Feed / Produce Visual */}
          <div className="bg-blue-50 p-4 rounded-lg shadow-inner flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Live Produce Feed</h2>
            <div className="w-full bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
              <img
                src={currentImage}
                alt="Produce Drying"
                className="w-full h-auto object-cover rounded-lg"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/CCCCCC/000000?text=Image+Error"; }}
              />
            </div>
            <p className="mt-4 text-center text-gray-600 font-medium">
              {currentDisplayData ? currentDisplayData.Produce_Type : "Select Produce"}
            </p>
          </div>

          {/* Sensor Readings & AI Insights */}
          <div className="bg-green-50 p-4 rounded-lg shadow-inner flex flex-col justify-between">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Current Conditions & AI Insights</h2>
            {currentDisplayData ? (
              <div className="space-y-4">
                <div className="flex items-center bg-white p-3 rounded-md shadow-sm border border-green-200">
                  <Thermometer className="w-6 h-6 text-red-500 mr-3"/>
                  <span className="font-medium text-lg">Temperature:</span>
                  <span className="ml-auto text-xl font-bold text-red-600">{currentDisplayData.Temperature_C?.toFixed(1)} °C</span>
                </div>
                <div className="flex items-center bg-white p-3 rounded-md shadow-sm border border-green-200">
                  <Droplets className="w-6 h-6 text-blue-500 mr-3"/>
                  <span className="font-medium text-lg">Humidity:</span>
                  <span className="ml-auto text-xl font-bold text-blue-600">{currentDisplayData.Humidity_PCT?.toFixed(1)} %</span>
                </div>
                <div className="flex items-center bg-white p-3 rounded-md shadow-sm border border-green-200">
                  <Gauge className="w-6 h-6 text-purple-500 mr-3"/>
                  <span className="font-medium text-lg">Pressure:</span>
                  <span className="ml-auto text-xl font-bold text-purple-600">{currentDisplayData.Pressure_hPa?.toFixed(1)} hPa</span>
                </div>
                <div className="flex items-center bg-white p-3 rounded-md shadow-sm border border-green-200">
                  <Leaf className="w-6 h-6 text-green-500 mr-3"/>
                  <span className="font-medium text-lg">AI Dryness (Predicted):</span>
                  <span className="ml-auto text-xl font-bold text-green-700">{currentDisplayData.Dryness_PCT?.toFixed(1)} %</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-10">Waiting for sensor data...</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={handlePlayPause}
            className={`flex items-center px-6 py-3 rounded-full shadow-md transition-all duration-300 ${
              isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-semibold text-lg`}
          >
            {isPlaying ? <Pause className="w-5 h-5 mr-2"/> : <Play className="w-5 h-5 mr-2"/>}
            {isPlaying ? 'Pause Simulation' : 'Start Simulation'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full shadow-md transition-all duration-300 font-semibold text-lg"
          >
            <RotateCcw className="w-5 h-5 mr-2"/>
            Reset
          </button>
        </div>
      </div>

      <p className="mt-8 text-gray-600 text-sm text-center max-w-2xl">
        This is a simulated prototype demonstrating DehydrAIte's dashboard.
        Data is loaded from a CSV file, and images are placeholders representing drying stages and anomalies.
        AI predictions for dryness are directly from the simulated dataset.
      </p>
    </div>
  );
};

export default App;