export function focusFirstInvalidField(form: HTMLFormElement) {
  window.requestAnimationFrame(() => {
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}
