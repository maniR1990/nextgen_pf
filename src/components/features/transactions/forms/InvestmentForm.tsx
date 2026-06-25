'use client';

import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import { CommonFormFields } from './CommonFormFields';
import { ASSET_CLASSES, TAX_SECTIONS, MF_PLANS } from '@/constants/finance';
import type { TransactionFormValues, FormErrors } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';

interface InvestmentFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => void;
  paymentSources: PaymentSourceOption[];
}

export function InvestmentForm({ values, errors, onChange, paymentSources }: InvestmentFormProps) {
  const isMFOrElss = ['equity_mf', 'elss'].includes(values.assetClass);

  return (
    <div className="tx-form tx-form--investment">
      {/* Asset Class + Fund Name — fund name spans 2 cols when shown */}
      {isMFOrElss ? (
        <div className="tx-form__row">
          <SelectField
            label="Asset Class"
            id="tx-asset-class"
            value={values.assetClass}
            options={ASSET_CLASSES.map((a) => ({ value: a.value, label: a.label }))}
            placeholder="Select asset type"
            error={errors.assetClass}
            required
            onChange={(e) => onChange('assetClass', e.target.value)}
          />
          <div className="tx-form__col--span-2">
            <FormField label="Fund Name" htmlFor="tx-fund-name" error={errors.fundName}>
              <input
                id="tx-fund-name"
                type="text"
                className={['form-input', errors.fundName && 'form-input--error'].filter(Boolean).join(' ')}
                value={values.fundName}
                placeholder="e.g. Parag Parikh Flexicap"
                onChange={(e) => onChange('fundName', e.target.value)}
              />
            </FormField>
          </div>
        </div>
      ) : (
        <SelectField
          label="Asset Class"
          id="tx-asset-class"
          value={values.assetClass}
          options={ASSET_CLASSES.map((a) => ({ value: a.value, label: a.label }))}
          placeholder="Select asset type"
          error={errors.assetClass}
          required
          onChange={(e) => onChange('assetClass', e.target.value)}
        />
      )}

      {/* Units | NAV */}
      <div className="tx-form__row tx-form__row--2">
        <FormField label="Units" htmlFor="tx-units" error={errors.units}>
          <input
            id="tx-units"
            type="number"
            step="0.0001"
            min="0"
            className={['form-input', errors.units && 'form-input--error'].filter(Boolean).join(' ')}
            value={values.units}
            placeholder="0.0000"
            onChange={(e) => onChange('units', e.target.value)}
          />
        </FormField>

        <FormField label="NAV / Price (₹)" htmlFor="tx-nav" error={errors.nav}>
          <input
            id="tx-nav"
            type="number"
            step="0.01"
            min="0"
            className={['form-input', errors.nav && 'form-input--error'].filter(Boolean).join(' ')}
            value={values.nav}
            placeholder="0.00"
            onChange={(e) => onChange('nav', e.target.value)}
          />
        </FormField>
      </div>

      {/* Plan (MF only) | Tax Section */}
      {isMFOrElss ? (
        <div className="tx-form__row tx-form__row--2">
          <SelectField
            label="Plan"
            id="tx-mf-plan"
            value={values.mfPlan}
            options={MF_PLANS.map((p) => ({ value: p.value, label: p.label }))}
            onChange={(e) => onChange('mfPlan', e.target.value)}
          />
          <SelectField
            label="Tax Section"
            id="tx-tax-section"
            value={values.taxSection}
            options={TAX_SECTIONS.map((t) => ({ value: t.value, label: t.label }))}
            placeholder="None"
            onChange={(e) => onChange('taxSection', e.target.value)}
          />
        </div>
      ) : (
        <SelectField
          label="Tax Section"
          id="tx-tax-section"
          value={values.taxSection}
          options={TAX_SECTIONS.map((t) => ({ value: t.value, label: t.label }))}
          placeholder="None"
          onChange={(e) => onChange('taxSection', e.target.value)}
        />
      )}

      <CommonFormFields
        values={values}
        errors={errors}
        onChange={onChange}
        paymentSources={paymentSources}
        showDate={false}
        showAccount={false}
        showPlanned={false}
        showRecurring={false}
        showTags
        showNotes
      />
    </div>
  );
}
