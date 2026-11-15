import { View } from 'react-native';
import { etiquetaPeriodo, type Periodo } from '@/fecha';
import { hoy } from '@/db';
import { CaretLeftIcon, CaretRightIcon } from '@/icons';
import { space } from '@/theme';
import { useColors, useT } from '@/tema';
import { animar, Chip, Label, Row, Tap } from '@/ui';

export type Rango = { periodo: Periodo; desp: number }; // desp: 0 = the current week/month, -1 = the one before...

// Week / Month / All with arrows to step back, shared by Home, Orders and History.
export function SelectorPeriodo({ valor, onChange }: { valor: Rango; onChange: (r: Rango) => void }) {
  const colors = useColors();
  const t = useT();
  const { periodo, desp } = valor;
  return (
    <View style={{ gap: space.sm }}>
      <Row style={{ gap: space.sm, flexWrap: 'nowrap' }}>
        {(['semana', 'mes', 'todo'] as const).map((k) => (
          <Chip key={k} block label={k === 'semana' ? t('Semana') : k === 'mes' ? t('Mes') : t('Todo')} on={periodo === k} onPress={() => { animar(); onChange({ periodo: k, desp: 0 }); }} />
        ))}
      </Row>
      {periodo !== 'todo' && (
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Tap onPress={() => onChange({ periodo, desp: desp - 1 })} label={t('Anterior')} style={{ padding: space.sm }}><CaretLeftIcon size={22} color={colors.primary} weight="bold" /></Tap>
          <Label>{etiquetaPeriodo(periodo, desp, hoy(), t)}</Label>
          <Tap onPress={() => desp < 0 && onChange({ periodo, desp: desp + 1 })} label={t('Siguiente')} style={{ padding: space.sm, opacity: desp < 0 ? 1 : 0.3 }}><CaretRightIcon size={22} color={colors.primary} weight="bold" /></Tap>
        </Row>
      )}
    </View>
  );
}
