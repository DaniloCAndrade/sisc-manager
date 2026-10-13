// hooks/useScheduleData.ts
import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { dailyScheduleService } from '@/services/scheduleServices';
import type { DailySchedule, DailyScheduleResponse } from '@/types/schedule';

/** Primeiro dia do mês em UTC — evita drift de timezone (UTC-3) */
function primeiroDiaUTC(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
}

/** Último dia do mês em UTC */
function ultimoDiaUTC(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0));
}

export function useScheduleData() {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [scheduleResponse, setScheduleResponse] = useState<DailyScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const buscarEscala = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const res = await dailyScheduleService.getPeriodo(
        primeiroDiaUTC(date),
        ultimoDiaUTC(date),
      );
      setScheduleResponse(res);
    } catch (err) {
      console.error('[useScheduleData] buscarEscala:', err);
      message.error('Erro ao carregar escala.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refazerEscala = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dailyScheduleService.gerar(
        primeiroDiaUTC(dataSelecionada),
        ultimoDiaUTC(dataSelecionada),
      );
      setScheduleResponse(res);
      message.success('Escala gerada com sucesso!');
    } catch (err) {
      console.error('[useScheduleData] refazerEscala:', err);
      message.error('Erro ao gerar escala.');
    } finally {
      setLoading(false);
    }
  }, [dataSelecionada]);

  const saveSchedule = useCallback(async (updated: Partial<DailySchedule>) => {
    try {
      const saved = await dailyScheduleService.salve(updated);
      setScheduleResponse(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map(d => d._id === saved._id ? saved : d),
        };
      });
      message.success('Dia atualizado!');
    } catch (err) {
      console.error('[useScheduleData] saveSchedule:', err);
      message.error('Erro ao salvar dia.');
    }
  }, []);

  useEffect(() => {
    buscarEscala(dataSelecionada);
  }, [dataSelecionada, buscarEscala]);

  return {
    scheduleResponse,
    loading,
    dataSelecionada,
    setDataSelecionada,
    refazerEscala,
    saveSchedule,
  };
}