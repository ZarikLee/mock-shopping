<template>
  <div class="address-picker">
    <el-select v-model="province" placeholder="省份" @change="onProvinceChange" class="ap-select">
      <el-option v-for="p in provinces" :key="p.name" :label="p.name" :value="p.name" />
    </el-select>
    <el-select v-model="city" placeholder="城市" :disabled="!province" @change="onCityChange" class="ap-select">
      <el-option v-for="c in currentCities" :key="c.name" :label="c.name" :value="c.name" />
    </el-select>
    <el-select v-model="district" placeholder="区县" :disabled="!city" @change="$emit('change', getValue())" class="ap-select">
      <el-option v-for="d in currentDistricts" :key="d" :label="d" :value="d" />
    </el-select>
    <el-select v-model="detail" placeholder="详细地址" @change="$emit('change', getValue())" class="ap-select ap-detail">
      <el-option v-for="loc in fancyLocations" :key="loc" :label="loc" :value="loc" />
    </el-select>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { provinces, fancyLocations } from '../../data/addressData'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ province: '', city: '', district: '', detail: '' }),
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const province = ref(props.modelValue?.province || '')
const city = ref(props.modelValue?.city || '')
const district = ref(props.modelValue?.district || '')
const detail = ref(props.modelValue?.detail || '')

const currentCities = computed(() => {
  const p = provinces.find(p => p.name === province.value)
  return p?.cities || []
})

const currentDistricts = computed(() => {
  const p = provinces.find(p => p.name === province.value)
  const c = p?.cities?.find(c => c.name === city.value)
  return c?.districts || []
})

const getValue = () => ({
  province: province.value,
  city: city.value,
  district: district.value,
  detail: detail.value,
})

const emitChange = () => {
  const value = getValue()
  emit('update:modelValue', value)
  emit('change', value)
}

const onProvinceChange = () => {
  city.value = ''
  district.value = ''
  emitChange()
}

const onCityChange = () => {
  district.value = ''
  emitChange()
}

const syncModel = () => {
  province.value = props.modelValue?.province || ''
  city.value = props.modelValue?.city || ''
  district.value = props.modelValue?.district || ''
  detail.value = props.modelValue?.detail || ''
}

watch(() => props.modelValue, syncModel, { deep: true })

watch([province, city, district, detail], emitChange)
</script>

<style scoped>
.address-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ap-select {
  width: 140px;
}

.ap-detail {
  flex: 1;
  min-width: 180px;
}

@media (max-width: 480px) {
  .ap-select {
    width: 100%;
  }

  .ap-detail {
    flex: none;
    width: 100%;
  }
}
</style>
