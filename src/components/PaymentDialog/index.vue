<template>
  <el-dialog :model-value="visible" width="380px" :close-on-click-modal="false" :show-close="false" top="25vh">
    <div class="pay-dialog">
      <div class="pay-brand">
        <span class="pay-brand-icon">{{ brandIcon }}</span>
        <span class="pay-brand-name">{{ brandName }}</span>
      </div>
      <div class="pay-amount">
        <span class="amount-label">支付金额</span>
        <span class="amount-value">¥{{ amount.toFixed(2) }}</span>
      </div>
      <div class="pay-password">
        <input
          v-for="(d, i) in passwordDigits"
          :key="i"
          type="password"
          class="pass-input"
          :value="d"
          :ref="el => passInputs[i] = el"
          @input="handleInput(i, $event)"
          @keydown.backspace="handleBackspace(i, $event)"
        />
      </div>
      <p class="pay-tip">请输入6位支付密码</p>
      <p class="pay-disclaimer">⚠️ 仅供游戏模拟，不涉及真实资金，请勿输入真实支付密码</p>
      <div class="pay-actions">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" :disabled="password.length !== 6" @click="confirm">确认支付</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  amount: { type: Number, default: 0 },
  brandName: { type: String, default: '支付' },
  brandIcon: { type: String, default: '' }
})

const emit = defineEmits(['cancel', 'confirm'])

const password = ref('')
const passwordDigits = ref(Array(6).fill(''))
const passInputs = ref([])

watch(() => props.visible, (val) => {
  if (val) {
    password.value = ''
    passwordDigits.value = Array(6).fill('')
    setTimeout(() => {
      passInputs.value[0]?.focus()
    }, 50)
  }
})

const handleInput = (i, event) => {
  const value = event.target.value.replace(/\D/g, '').slice(-1)
  passwordDigits.value[i] = value
  if (value) {
    password.value = passwordDigits.value.join('')
    if (i < 5) {
      passInputs.value[i + 1]?.focus()
    }
  }
}

const handleBackspace = (i, event) => {
  if (passwordDigits.value[i]) {
    passwordDigits.value[i] = ''
    password.value = passwordDigits.value.join('')
  } else if (i > 0) {
    passwordDigits.value[i - 1] = ''
    password.value = passwordDigits.value.join('')
    passInputs.value[i - 1]?.focus()
  }
}

const cancel = () => {
  emit('cancel')
}

const confirm = () => {
  if (password.value.length === 6) {
    emit('confirm', password.value)
  }
}
</script>

<style scoped>
.pay-dialog {
  padding: 10px 0;
  text-align: center;
}

.pay-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
}

.pay-brand-icon {
  font-size: 28px;
  line-height: 1;
}

.pay-brand-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.pay-amount {
  margin-bottom: 25px;
}

.amount-label {
  display: block;
  font-size: 13px;
  color: #999;
  margin-bottom: 5px;
}

.amount-value {
  font-size: 30px;
  font-weight: bold;
  color: #ff4400;
}

.pay-password {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
}

.pass-input {
  width: 40px;
  height: 44px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  outline: none;
  transition: all 0.3s;
}

.pass-input:focus {
  border-color: #ff4400;
  box-shadow: 0 0 0 2px rgba(255, 68, 0, 0.15);
}

.pay-tip {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.pay-disclaimer {
  font-size: 12px;
  color: #ff8800;
  background: #fff7e6;
  border: 1px solid #ffe7ba;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.pay-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.pay-actions .el-button {
  flex: 1;
  border-radius: 8px;
  height: 40px;
}

.pay-actions .el-button--primary {
  background: #ff4400;
  border-color: #ff4400;
}

.pay-actions .el-button--primary:hover {
  background: #ff6600;
  border-color: #ff6600;
}
</style>
