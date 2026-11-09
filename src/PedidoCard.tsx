import { useRouter } from 'expo-router';
import { memo } from 'react';
import { View } from 'react-native';
import { estadoDe } from '@/calc';
import type { PedidoRow } from '@/db';
import { pagoColores } from '@/paleta';
import { useColors, useT } from '@/tema';
import { PackageIcon } from '@/icons';
import { Appear, Card, money, Pill, Row, Small, Sub, Tap } from '@/ui';

export const PedidoCard = memo(function PedidoCard({ r, index = 0 }: { r: PedidoRow; index?: number }) {
  const colors = useColors();
  const t = useT();
  const router = useRouter();
  const est = estadoDe(r.total, r.pagado);
  return (
    <Appear delay={Math.min(index, 8) * 40}>
      <Tap onPress={() => router.push(`/pedido/${r.id}`)} label={t('Pedido de {nombre}', { nombre: r.cliente })}>
        <Card>
          <Row>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
              <PackageIcon size={24} color={colors.primary} weight="duotone" />
            </View>
            <View style={{ flex: 1 }}>
              <Sub lines={1}>{r.cliente}</Sub>
              <Small>{r.fecha}</Small>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Sub>{money(r.total)}</Sub>
              <Small color={colors.primary}>{t('gana {monto}', { monto: money(r.total - r.costo) })}</Small>
            </View>
          </Row>
          <Row>
            <Pill label={t(est)} bg={pagoColores(colors)[est].bg} fg={pagoColores(colors)[est].fg} />
            <Pill label={r.entregado ? t('entregado') : t('por entregar')} bg={r.entregado ? colors.soft : colors.line} fg={r.entregado ? colors.primaryPressed : colors.muted} />
          </Row>
        </Card>
      </Tap>
    </Appear>
  );
});
