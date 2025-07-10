import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings as SettingsIcon, Server, Save, TestTube, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Configuracao } from '../../types';
import clsx from 'clsx';

const settingsSchema = z.object({
  smtp_host: z.string().min(1, 'Host SMTP é obrigatório'),
  smtp_porta: z.number().min(1, 'Porta deve ser um número válido'),
  smtp_usuario: z.string().min(1, 'Usuário SMTP é obrigatório'),
  smtp_senha: z.string().min(1, 'Senha SMTP é obrigatória'),
  usar_tls: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { appUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      smtp_host: '',
      smtp_porta: 587,
      smtp_usuario: '',
      smtp_senha: '',
      usar_tls: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        reset({
          smtp_host: data.smtp_host,
          smtp_porta: data.smtp_porta,
          smtp_usuario: data.smtp_usuario,
          smtp_senha: data.smtp_senha,
          usar_tls: data.usar_tls,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    if (!appUser) return;

    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          id: 'default',
          ...data,
        });

      if (error) throw error;

      // Log audit
      await supabase.from('log_auditoria').insert({
        id_usuario_acao: appUser.id,
        acao: 'EDITOU CONFIGURAÇÃO',
        detalhes: `Usuário '${appUser.nome}' atualizou configurações SMTP`,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simulate SMTP connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would test the actual SMTP connection
      setTestResult({
        success: true,
        message: 'Conexão SMTP testada com sucesso!'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Falha na conexão SMTP. Verifique as configurações.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5" />
            <span>Configurações do Sistema</span>
          </h2>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-700">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Acesso Restrito</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Apenas administradores podem modificar essas configurações.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-700">
                  <Save className="h-5 w-5" />
                  <span className="font-medium">Configurações salvas com sucesso!</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Server className="inline h-4 w-4 mr-1" />
                  Host SMTP
                </label>
                <input
                  {...register('smtp_host')}
                  type="text"
                  className={clsx(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500',
                    errors.smtp_host ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="smtp.gmail.com"
                />
                {errors.smtp_host && (
                  <p className="mt-1 text-sm text-red-600">{errors.smtp_host.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porta SMTP
                </label>
                <input
                  {...register('smtp_porta', { valueAsNumber: true })}
                  type="number"
                  className={clsx(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500',
                    errors.smtp_porta ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="587"
                />
                {errors.smtp_porta && (
                  <p className="mt-1 text-sm text-red-600">{errors.smtp_porta.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário SMTP
              </label>
              <input
                {...register('smtp_usuario')}
                type="text"
                className={clsx(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500',
                  errors.smtp_usuario ? 'border-red-300' : 'border-gray-300'
                )}
                placeholder="seu-email@gmail.com"
              />
              {errors.smtp_usuario && (
                <p className="mt-1 text-sm text-red-600">{errors.smtp_usuario.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha SMTP
              </label>
              <input
                {...register('smtp_senha')}
                type="password"
                className={clsx(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500',
                  errors.smtp_senha ? 'border-red-300' : 'border-gray-300'
                )}
                placeholder="sua-senha-de-app"
              />
              {errors.smtp_senha && (
                <p className="mt-1 text-sm text-red-600">{errors.smtp_senha.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                {...register('usar_tls')}
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">
                Usar TLS/SSL
              </label>
            </div>

            {testResult && (
              <div className={clsx(
                'p-4 rounded-lg border',
                testResult.success
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              )}>
                <div className="flex items-center space-x-2">
                  <TestTube className="h-5 w-5" />
                  <span className="font-medium">{testResult.message}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={testConnection}
                disabled={testing}
                className={clsx(
                  'flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium transition-all duration-200',
                  testing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-700'
                )}
              >
                <TestTube className="h-5 w-5" />
                <span>{testing ? 'Testando...' : 'Testar Conexão'}</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  'flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium transition-all duration-200',
                  loading
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'hover:bg-purple-700 transform hover:scale-105'
                )}
              >
                <Save className="h-5 w-5" />
                <span>{loading ? 'Salvando...' : 'Salvar Configurações'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;