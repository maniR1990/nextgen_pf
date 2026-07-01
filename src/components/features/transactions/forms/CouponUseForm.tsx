'use client';

import { FormField } from '@/components/common/FormField';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { CommonFormFields } from './CommonFormFields';

interface CouponUseFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
}

export function CouponUseForm({ values, errors, onChange, paymentSources }: CouponUseFormProps) {
  const origNum = Number.parseFloat(values.origPrice);
  const discountNum = Number.parseFloat(values.amount);
  const finalPrice =
    !Number.isNaN(origNum) && !Number.isNaN(discountNum) ? origNum - discountNum : null;

  return (
    <div className="tx-form tx-form--coupon">
      {/* Merchant | Original Price */}
      <div className="tx-form__row tx-form__row--2">
        <FormField
          label="Merchant / Platform"
          htmlFor="tx-merchant"
          error={errors.merchant}
          required
        >
          <input
            id="tx-merchant"
            type="text"
            className={['form-input', errors.merchant && 'form-input--error']
              .filter(Boolean)
              .join(' ')}
            value={values.merchant}
            placeholder="e.g. Zomato, BigBasket"
            onChange={(e) => onChange('merchant', e.target.value)}
          />
        </FormField>

        <FormField label="Original Price (₹)" htmlFor="tx-orig-price">
          <input
            id="tx-orig-price"
            type="number"
            step="0.01"
            min="0"
            className="form-input"
            value={values.origPrice}
            placeholder="Full price before coupon"
            onChange={(e) => onChange('origPrice', e.target.value)}
          />
        </FormField>
      </div>

      {finalPrice !== null && finalPrice > 0 && (
        <div className="tx-form__coupon-summary">
          <span>You pay: </span>
          <strong>₹{finalPrice.toLocaleString('en-IN')}</strong>
        </div>
      )}

      {/* Coupon Code | Platform */}
      <div className="tx-form__row tx-form__row--2">
        <FormField label="Coupon Code" htmlFor="tx-coupon-code">
          <input
            id="tx-coupon-code"
            type="text"
            className="form-input"
            value={values.couponCode}
            placeholder="e.g. SAVE200"
            onChange={(e) => onChange('couponCode', e.target.value)}
          />
        </FormField>

        <FormField label="Platform / App" htmlFor="tx-platform">
          <input
            id="tx-platform"
            type="text"
            className="form-input"
            value={values.platform}
            placeholder="e.g. Swiggy app, Website"
            onChange={(e) => onChange('platform', e.target.value)}
          />
        </FormField>
      </div>

      <CommonFormFields
        values={values}
        errors={errors}
        onChange={onChange}
        paymentSources={paymentSources}
        showDate={false}
        showAccount={false}
        showPlanned={false}
        showRecurring={false}
        showTags={false}
      />
    </div>
  );
}
