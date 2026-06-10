import { describe, it, expect } from 'vitest'
import { escapeCsvField, toCsv } from '../../src/lib/csv'

describe('escapeCsvField', () => {
  it('deja valores simples sin comillas', () => {
    expect(escapeCsvField('Juan')).toBe('Juan')
    expect(escapeCsvField(42)).toBe('42')
    expect(escapeCsvField(null)).toBe('')
    expect(escapeCsvField(undefined)).toBe('')
  })

  it('encierra y escapa cuando hay coma, comilla o salto de línea', () => {
    expect(escapeCsvField('Pérez, Juan')).toBe('"Pérez, Juan"')
    expect(escapeCsvField('dice "hola"')).toBe('"dice ""hola"""')
    expect(escapeCsvField('línea1\nlínea2')).toBe('"línea1\nlínea2"')
  })
})

describe('toCsv', () => {
  it('arma encabezados + filas con CRLF y escapa lo necesario', () => {
    const csv = toCsv(
      ['Nombre', 'Tel'],
      [
        ['Ana', '300'],
        ['Beto, B', '301'],
      ]
    )
    expect(csv).toBe('Nombre,Tel\r\nAna,300\r\n"Beto, B",301')
  })
})
