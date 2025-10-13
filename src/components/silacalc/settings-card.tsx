
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CalculationDefaults } from '@/lib/calculator';
import { DEFAULTS } from '@/lib/calculator';
import { Separator } from '../ui/separator';

type SettingsCardProps = {
  settings: CalculationDefaults;
  setSettings: React.Dispatch<React.SetStateAction<CalculationDefaults>>;
};

export function SettingsCard({ settings, setSettings }: SettingsCardProps) {
  const handleSettingChange = (
    key: keyof CalculationDefaults,
    value: string
  ) => {
    setSettings((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const basicSettings = [
    { key: 'blockLength', label: 'Block Length (m)' },
    { key: 'blockWidth', label: 'Block Width (m)' },
    { key: 'beamSpacing', label: 'Beam Spacing (m)'},
    { key: 'toppingThickness', label: 'Topping Thickness (m)' },
    { key: 'brcRollWidth', label: 'BRC Roll Width (m)' },
    { key: 'brcRollLength', label: 'BRC Roll Length (m)' },
    { key: 'beamSectionW', label: 'Beam Section W (m)' },
    { key: 'beamSectionH', label: 'Beam Section H (m)' },
    { key: 'wastagePercentage', label: 'Wastage (%)' },
  ];
  
  const concreteRatioSettings = [
    { key: 'concreteMixRatioCement', label: 'Cement' },
    { key: 'concreteMixRatioSand', label: 'Sand' },
    { key: 'concreteMixRatioBallast', label: 'Ballast' },
  ];

  const concreteMaterialSettings = [
    { key: 'wheelbarrowVolume', label: 'Wheelbarrow Vol. (m³)'},
    { key: 'wheelbarrowsPerTonne', label: 'Wheelbarrows per Tonne'},
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Configuration</CardTitle>
        <CardDescription>
          Adjust the default values for calculations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {basicSettings.map(({ key, label }) => (
            <div className="space-y-2" key={key}>
              <Label htmlFor={key} className="text-sm">
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                value={settings[key as keyof CalculationDefaults]}
                onChange={(e) =>
                  handleSettingChange(
                    key as keyof CalculationDefaults,
                    e.target.value
                  )
                }
                min="0"
                step="0.01"
                placeholder={String(DEFAULTS[key as keyof CalculationDefaults])}
              />
            </div>
          ))}
        </div>

        <Separator />

        <div>
          <Label className="text-base font-medium">Concrete Mix Ratio (by Volume)</Label>
          <p className="text-xs text-muted-foreground mb-2">e.g., 1 Bag Cement : 2 Wheelbarrows Sand : 4 Wheelbarrows Ballast</p>
          <div className="grid grid-cols-3 gap-x-2">
              {concreteRatioSettings.map(({ key, label }) => (
                <div className="space-y-2" key={key}>
                  <Label htmlFor={key} className="text-sm font-normal text-muted-foreground">{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    value={settings[key as keyof CalculationDefaults]}
                    onChange={(e) => handleSettingChange(key as keyof CalculationDefaults, e.target.value)}
                    min="0"
                    step="0.1"
                    placeholder={String(DEFAULTS[key as keyof CalculationDefaults])}
                  />
                </div>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {concreteMaterialSettings.map(({ key, label }) => (
            <div className="space-y-2" key={key}>
              <Label htmlFor={key} className="text-sm">
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                value={settings[key as keyof CalculationDefaults]}
                onChange={(e) =>
                  handleSettingChange(
                    key as keyof CalculationDefaults,
                    e.target.value
                  )
                }
                min="0"
                step="0.001"
                placeholder={String(DEFAULTS[key as keyof CalculationDefaults])}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
