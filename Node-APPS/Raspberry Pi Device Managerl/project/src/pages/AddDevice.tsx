import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDevices } from '../context/DeviceContext';
import { DeviceType, ProtocolType } from '../types';
import ProtocolFields from '../components/devices/ProtocolFields';
import { ArrowLeft, Save } from 'lucide-react';

interface FormData {
  name: string;
  description: string;
  type: DeviceType;
  protocol: ProtocolType;
  // Protocol specific fields will be handled dynamically
  [key: string]: any;
}

const AddDevice: React.FC = () => {
  const { addDevice } = useDevices();
  const navigate = useNavigate();
  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      type: 'sensor',
      protocol: 'UART'
    }
  });
  
  const selectedProtocol = watch('protocol');
  
  const onSubmit = async (data: FormData) => {
    try {
      // Extract protocol-specific configuration
      const { name, description, type, protocol, ...protocolConfig } = data;
      
      const newDevice = {
        name,
        description,
        type,
        status: 'offline' as const,
        config: {
          protocol,
          ...protocolConfig
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const result = await addDevice(newDevice);
      
      if (result) {
        toast.success(`Device "${name}" added successfully`);
        navigate('/devices');
      }
    } catch (err) {
      toast.error('Failed to add device');
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/devices')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Add New Device</h1>
      </div>
      
      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-medium mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Device Name *</label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "Device name is required" }}
                  render={({ field }) => (
                    <input 
                      {...field} 
                      type="text" 
                      id="name" 
                      className={`form-input ${errors.name ? 'border-red-500' : ''}`} 
                    />
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="type" className="form-label">Device Type *</label>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: "Device type is required" }}
                  render={({ field }) => (
                    <select {...field} id="type" className="form-select">
                      <option value="sensor">Sensor</option>
                      <option value="actuator">Actuator</option>
                      <option value="display">Display</option>
                      <option value="communication">Communication</option>
                      <option value="custom">Custom</option>
                    </select>
                  )}
                />
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>
            </div>
            
            <div className="form-group mt-4">
              <label htmlFor="description" className="form-label">Description</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <textarea 
                    {...field} 
                    id="description" 
                    rows={3}
                    className="form-input" 
                    placeholder="Enter device description..."
                  />
                )}
              />
            </div>
          </div>
          
          {/* Protocol Configuration */}
          <div>
            <h2 className="text-lg font-medium mb-4">Protocol Configuration</h2>
            
            <div className="form-group">
              <label htmlFor="protocol" className="form-label">Protocol *</label>
              <Controller
                name="protocol"
                control={control}
                rules={{ required: "Protocol is required" }}
                render={({ field }) => (
                  <select {...field} id="protocol" className="form-select">
                    <option value="UART">UART</option>
                    <option value="USART">USART</option>
                    <option value="RS232">RS-232</option>
                    <option value="RS422">RS-422</option>
                    <option value="RS485">RS-485</option>
                    <option value="SPI">SPI</option>
                    <option value="I2C">I2C</option>
                    <option value="SSI">SSI</option>
                    <option value="1-Wire">1-Wire</option>
                    <option value="CAN">CAN</option>
                    <option value="LIN">LIN</option>
                  </select>
                )}
              />
              {errors.protocol && (
                <p className="mt-1 text-sm text-red-600">{errors.protocol.message}</p>
              )}
            </div>
            
            {/* Protocol specific fields */}
            <ProtocolFields protocol={selectedProtocol} control={control} errors={errors} />
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/devices')}
              className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 mr-2"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Device
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDevice;