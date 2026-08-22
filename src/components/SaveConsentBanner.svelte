<script lang="ts">
  let { onAccept, onDecline }: { onAccept: () => void; onDecline: () => void } = $props()
</script>

<div class="consent-banner" role="dialog" aria-label="Save progress">
  <p class="consent-text">
    Save your progress in this browser? We'd store your board, notes and difficulty on this device so your game is still
    here next time you reload or open a new tab. Nothing leaves your browser.
  </p>
  <div class="consent-actions">
    <button class="consent-decline" onclick={onDecline}>Don't save</button>
    <button class="consent-accept" onclick={onAccept}>Save my progress</button>
  </div>
</div>
