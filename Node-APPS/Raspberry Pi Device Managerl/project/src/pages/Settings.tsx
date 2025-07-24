import React from 'react';
import { Save } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">Connection Settings</h2>
        <div className="form-group">
          <label htmlFor="serverUrl" className="form-label">Server URL</label>
          <input
            type="text"
            id="serverUrl"
            className="form-input"
            defaultValue="http://localhost:3000"
            placeholder="http://localhost:3000"
          />
          <p className="text-sm text-gray-500 mt-1">
            The URL of the Raspberry Pi device manager server
          </p>
        </div>
        
        <div className="form-group">
          <label htmlFor="refreshRate" className="form-label">Data Refresh Rate</label>
          <select
            id="refreshRate"
            className="form-select"
            defaultValue="2"
          >
            <option value="0.5">0.5 seconds</option>
            <option value="1">1 second</option>
            <option value="2">2 seconds</option>
            <option value="5">5 seconds</option>
            <option value="10">10 seconds</option>
          </select>
        </div>
        
        <div className="form-group mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
              defaultChecked
            />
            <span className="ml-2">Auto-reconnect on connection loss</span>
          </label>
        </div>
      </div>
      
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">Appearance</h2>
        
        <div className="form-group">
          <label htmlFor="theme" className="form-label">Application Theme</label>
          <select
            id="theme"
            className="form-select"
            defaultValue="system"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="dataDisplay" className="form-label">Default Data Display</label>
          <select
            id="dataDisplay"
            className="form-select"
            defaultValue="chart"
          >
            <option value="chart">Chart</option>
            <option value="list">List</option>
          </select>
        </div>
      </div>
      
      <div className="card p-6">
        <h2 className="text-xl font-medium mb-4">Hardware Settings</h2>
        
        <div className="form-group">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
              defaultChecked
            />
            <span className="ml-2">Enable simulation mode when hardware is unavailable</span>
          </label>
          <p className="text-sm text-gray-500 mt-1 ml-7">
            This allows testing without physical hardware
          </p>
        </div>
        
        <div className="form-group">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
              defaultChecked
            />
            <span className="ml-2">Auto-detect hardware interfaces</span>
          </label>
        </div>
        
        <div className="form-group">
          <label htmlFor="logLevel" className="form-label">Logging Level</label>
          <select
            id="logLevel"
            className="form-select"
            defaultValue="info"
          >
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button className="btn btn-primary flex items-center">
          <Save size={18} className="mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;