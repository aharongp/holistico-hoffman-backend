import {
  AttitudinalStrengthResult,
  AttitudinalSummary,
  DailyReviewResult,
  HealthDiagnosticResult,
  PonderacionResult,
  TestResult,
} from '../entities/patient-instrument-results.entity';

type MaybeNumber = number | null | undefined;

type ResultadoTestParams = {
  edad?: MaybeNumber;
  test: string;
  valor: MaybeNumber;
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

const toNumber = (value: MaybeNumber): number => {
  if (typeof value !== 'number') {
    return 0;
  }
  return Number.isFinite(value) ? value : 0;
};

export const colorValor = (valor: number | null): string | null => {
  if (valor === null || Number.isNaN(valor)) {
    return null;
  }

  if (valor <= 2) {
    return 'text-red';
  }

  if (valor > 2.1 && valor <= 3) {
    return 'text-yellow';
  }

  if (valor > 3.1) {
    return 'text-green';
  }

  return null;
};

export const ponderacion = (valor: number | null): PonderacionResult => {
  const normalized = clamp(toNumber(valor), 0, 100);

  if (normalized >= 0 && normalized <= 30) {
    return {
      holistica: 'Por debajo de lo esperado',
      academica: 'Deficiente',
      icono: 'fa fa-frown-o',
      colorTexto: 'text-danger',
    };
  }

  if (normalized >= 31 && normalized <= 60) {
    return {
      holistica: 'Debe pedir ayuda',
      academica: 'Regular',
      icono: 'fa fa-frown-o',
      colorTexto: 'text-orange',
    };
  }

  if (normalized >= 61 && normalized <= 80) {
    return {
      holistica: 'Punto de tranca',
      academica: 'Bueno',
      icono: 'fa fa-meh-o',
      colorTexto: 'text-orange',
    };
  }

  if (normalized >= 81 && normalized <= 99) {
    return {
      holistica: 'Bueno',
      academica: 'Muy bueno',
      icono: 'fa fa-smile-o',
      colorTexto: 'text-green',
    };
  }

  if (normalized === 100) {
    return {
      holistica: 'Excelente',
      academica: 'Excelente',
      icono: 'fa fa-thumbs-o-up',
      colorTexto: 'text-green',
    };
  }

  return {
    holistica: null,
    academica: null,
    icono: null,
    colorTexto: null,
  };
};

export const resultadoTest = ({ edad, test, valor }: ResultadoTestParams): TestResult => {
  const total = clamp(toNumber(valor), 0, 9999);
  const age = edad !== null && edad !== undefined ? toNumber(edad) : null;

  let nivel: string | null = null;
  let enunciado: string | null = null;
  let colorTexto: string | null = null;
  let icono: string | null = null;

  switch (test) {
    case 'estres':
      if (total >= 0 && total <= 14) {
        nivel = 'Nivel bajo';
        enunciado = 'Esta en control de su vida y sus circunstancias, posee buena adaptabilidad y resistencia ante las situaciones frustrantes';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-o-up';
      } else if (total >= 15 && total <= 36) {
        nivel = 'Nivel alto';
        enunciado = 'Le faltan recursos para el manejo del estrés, tiene baja resistencia y poca adaptabilidad, tenga cuidado con las situaciones estresantes y dedique un tiempo cada día para desarrollar sus habilidades y destrezas para el control del estrés';
        colorTexto = 'text-warning';
        icono = 'fa fa-meh-o';
      } else if (total >= 37 && total <= 59) {
        nivel = 'Nivel elevado';
        enunciado = 'Necesita ayuda, está presentando síntomas de distrés, requiere de un mayor descanso, y de las técnicas para el manejo del estrés efectivas (terapias, ejercicios, meditación, medicación, entre otros)';
        colorTexto = 'text-warning';
        icono = 'fa fa-frown-o';
      } else if (total >= 60 && total <= 84) {
        nivel = 'Nivel patologico';
        enunciado = 'Requiere de adaptación profesional, esta enfermo y su condición va a agravar si no se atiende de inmediato.';
        colorTexto = 'text-danger';
        icono = 'fa fa-smile-o';
      }
      break;

    case 'salud':
      if (age !== null) {
        if (age >= 15 && age <= 35) {
          if (total >= 100) {
            nivel = 'PRONOSTICO RESERVADO';
            enunciado = 'La situación es para actuar de inmediato.';
            colorTexto = 'text-danger';
            icono = 'fa fa-frown-o';
          } else if (total >= 71 && total <= 99) {
            nivel = 'NO ESTA BIEN';
            enunciado = '...hay que tomar medidas para corregir sus desequilibrios y excesos.';
            colorTexto = 'text-warning';
            icono = 'fa fa-frown-o';
          } else if (total >= 51 && total <= 70) {
            nivel = 'ESTA BIEN';
            enunciado = '...por ahora, pero debe corregirse y madurar, no puede seguir así. CUIDADO.';
            colorTexto = 'text-success';
            icono = 'fa fa-frown-o';
          } else if (total >= 0 && total <= 50) {
            nivel = '¡EXCELENTE';
            enunciado = 'Manténgase y siga mejorando.';
            colorTexto = 'text-success';
            icono = 'fa fa-thumbs-o-up';
          }
        } else if (age >= 36 && age <= 50) {
          if (total >= 86) {
            nivel = 'PRONOSTICO RESERVADO';
            enunciado = 'Podría ser ayudado si usted quisiese.';
            colorTexto = 'text-danger';
            icono = 'fa fa-frown-o';
          } else if (total >= 56 && total <= 85) {
            nivel = 'NO ESTA BIEN';
            enunciado = '¡Hay que tomar medidas ya! Busque ayuda!';
            colorTexto = 'text-warning';
            icono = 'fa fa-frown-o';
          } else if (total >= 41 && total <= 55) {
            nivel = 'ESTA BIEN';
            enunciado = '…pero la juventud no le asiste, tiene que cuidarse más.';
            colorTexto = 'text-success';
            icono = 'fa fa-smiles-o';
          } else if (total >= 0 && total <= 40) {
            nivel = '¡EXCELENTE!';
            enunciado = null;
            colorTexto = 'text-success';
            icono = 'fa fa-thumbs-o-up';
          }
        } else if (age >= 51) {
          if (total >= 75) {
            nivel = 'PRONOSTICO RESERVADO';
            enunciado = 'Es ahora o nunca';
            colorTexto = 'text-danger';
            icono = 'fa fa-frown-o';
          } else if (total >= 46 && total <= 74) {
            nivel = 'NO ESTA BIEN';
            enunciado = '¿Qué espera para hacer algo?';
            colorTexto = 'text-warning';
            icono = 'fa fa-frown-o';
          } else if (total >= 31 && total <= 45) {
            nivel = 'ESTA BIEN';
            enunciado = '…pero debe proceder a adaptarse a las necesidades de esta nueva etapa de vida.';
            colorTexto = 'text-success';
            icono = 'fa fa-smile-o';
          } else if (total >= 0 && total <= 30) {
            nivel = '¡EXCELENTE!';
            enunciado = null;
            colorTexto = 'text-success';
            icono = 'fa fa-thumbs-o-up';
          }
        }
      }
      break;

    case 'edad-biologica':
      if (age !== null) {
        if (age >= 15 && age <= 29) {
          if (total >= 46 && total <= 66) {
            nivel = 'Su edad esta entre 40 a 45 años';
            enunciado = 'Usted se esta matando';
            colorTexto = 'text-danger';
            icono = 'fa fa-frown-o';
          } else if (total >= 26 && total <= 45) {
            nivel = 'Su edad esta entre 35 a 44';
            enunciado = 'Necesita cambiar urgentemente los hábitos';
            colorTexto = 'text-warning';
            icono = 'fa fa-meh-o';
          } else if (total >= 16 && total <= 25) {
            nivel = 'Su edad esta entre 30 a 34';
            enunciado = 'Está envejeciendo, cuídese…';
            colorTexto = 'text-warning';
            icono = 'fa fa-frown-o';
          } else if (total >= 5 && total <= 15) {
            nivel = 'Su edad esta entre 25 a 30 años';
            enunciado = 'Puede mejorar su estilo de vida';
            colorTexto = 'text-success';
            icono = 'fa fa-smile-o';
          } else if (total >= 0 && total <= 4) {
            nivel = 'Su edad esta entre 20 a 25 años';
            enunciado = 'Felicitaciones siga cuidandose';
            colorTexto = 'text-success';
            icono = 'fa fa-thumbs-up';
          }
        } else if (age >= 30 && age <= 39) {
          if (total >= 46 && total <= 66) {
            nivel = 'Su edad esta entre 50 a 55 años';
            enunciado = 'Si sigue así sus días están contados';
            colorTexto = 'text-danger';
            icono = 'fa fa-frown-o';
          } else if (total >= 26 && total <= 45) {
            nivel = 'Su edad esta entre 45 a 49';
            enunciado = 'Cambie su estilo de vida ahora';
            colorTexto = 'text-warning';
            icono = 'fa fa-meh-o';
          } else if (total >= 16 && total <= 25) {
            nivel = 'Su edad esta entre 40 a 48';
            enunciado = 'Corrija su errores';
            colorTexto = 'text-warning';
            icono = 'fa fa-frown-o';
          } else if (total >= 5 && total <= 15) {
            nivel = 'Su edad esta entre 30 a 35 años';
            enunciado = 'Son pocas sus fallas y superables';
            colorTexto = 'text-success';
            icono = 'fa fa-smile-o';
          } else if (total >= 0 && total <= 4) {
            nivel = 'Su edad esta entre 25 a 30 años';
            enunciado = 'Ya le has ganado 5 años a la vida';
            colorTexto = 'text-success';
            icono = 'fa fa-thumbs-up';
          }
        } else if (age >= 40 && age <= 45) {
          if (total >= 46 && total <= 66) {
            nivel = 'Su edad esta entre 60 a 65 años';
            enunciado = 'Muy dificil serguir vivo si no cambia ya';
            colorTexto = 'text-danger';
            icono = 'fa fa-frown-o';
          } else if (total >= 26 && total <= 45) {
            nivel = 'Su edad esta entre 55 a 59';
            enunciado = 'Mejore su estilo de vida pronto';
            colorTexto = 'text-warning';
            icono = 'fa fa-meh-o';
          } else if (total >= 16 && total <= 25) {
            nivel = 'Su edad esta entre 45 a 49';
            enunciado = 'Corrija su fallas en el estilo de vida';
            colorTexto = 'text-warning';
            icono = 'fa fa-frown-o';
          } else if (total >= 5 && total <= 15) {
            nivel = 'Su edad esta entre 40 a 45 años';
            enunciado = 'Puede cuidarse mas';
            colorTexto = 'text-success';
            icono = 'fa fa-smile-o';
          } else if (total >= 0 && total <= 4) {
            nivel = 'Su edad esta entre 30 a 35 años';
            enunciado = 'Ya le has ganado 10 años a la vida';
            colorTexto = 'text-success';
            icono = 'fa fa-thumbs-up';
          }
        } else if (age >= 46 && age <= 55) {
          if (total >= 46 && total <= 66) {
            nivel = 'Su edad esta entre 70 a 75 años';
            enunciado = 'Es un milagro que este vivo';
            colorTexto = 'text-danger';
            icono = 'fa fa-frown-o';
          } else if (total >= 26 && total <= 45) {
            nivel = 'Su edad esta entre 65 a 74';
            enunciado = 'Piense en su familia, cuidese';
            colorTexto = 'text-warning';
            icono = 'fa fa-meh-o';
          } else if (total >= 16 && total <= 25) {
            nivel = 'Su edad esta entre 55 a 60';
            enunciado = 'Todavia esta a tiempo de cambiar';
            colorTexto = 'text-warning';
            icono = 'fa fa-frown-o';
          } else if (total >= 5 && total <= 15) {
            nivel = 'Su edad esta entre 51 a 59 años';
            enunciado = 'Puede cuidarse mas';
            colorTexto = 'text-success';
            icono = 'fa fa-smile-o';
          } else if (total >= 0 && total <= 4) {
            nivel = 'Su edad esta entre 35 a 40 años';
            enunciado = 'Va bien continúe así';
            colorTexto = 'text-success';
            icono = 'fa fa-thumbs-up';
          }
        } else if (age >= 56 && age <= 80) {
          if (total >= 46 && total <= 66) {
            nivel = 'Su edad esta entre 76 a 80 años';
            enunciado = 'No puede ser !Imposible que siga vivo';
            colorTexto = 'text-danger';
            icono = 'fa fa-frown-o';
          } else if (total >= 26 && total <= 45) {
            nivel = 'Su edad esta entre 70 a 75';
            enunciado = 'El deterioro es acentuado, ¡Cambie ya!';
            colorTexto = 'text-warning';
            icono = 'fa fa-meh-o';
          } else if (total >= 16 && total <= 25) {
            nivel = 'Su edad esta entre 67 a 70';
            enunciado = 'Todavía esta a tiempo de cambiar';
            colorTexto = 'text-warning';
            icono = 'fa fa-frown-o';
          } else if (total >= 5 && total <= 15) {
            nivel = 'Su edad esta entre 56 a 65 años';
            enunciado = 'Puede cuidarse mas';
            colorTexto = 'text-success';
            icono = 'fa fa-smile-o';
          } else if (total >= 0 && total <= 4) {
            nivel = 'Su edad esta entre 40 a 50 años';
            enunciado = '¡Siga disfrutando de la vida!';
            colorTexto = 'text-success';
            icono = 'fa fa-thumbs-up';
          }
        }
      }
      break;

    default:
      break;
  }

  return {
    nivel,
    enunciado,
    colorTexto,
    icono,
    total,
  };
};

export const buildCodependencyResult = (valor: MaybeNumber): TestResult => {
  const total = clamp(toNumber(valor), 0, 100);

  if (total < 33.34) {
    return {
      nivel: 'Tendencia baja',
      enunciado:
        'FELICIDADES usted presenta síntomas muy bajos de tendencias compulsivas o de tipo adictiva, continúe así, más, sin embargo, nunca es tarde para fortalecer las debilidades de carácter que de momento presenta.',
      colorTexto: 'text-success',
      icono: 'fa fa-thumbs-up',
      total,
    };
  }

  if (total < 66.67) {
    return {
      nivel: 'Tendencia moderada',
      enunciado:
        `${total} CUIDADO estas presentando algunos síntomas evidentes de comportamientos compulsivos múltiples que se pueden acentuar o agravar si no los identificas y los corriges cuanto antes.`,
      colorTexto: 'text-warning',
      icono: 'fa fa-meh-o',
      total,
    };
  }

  return {
    nivel: 'Tendencia alta',
    enunciado:
      'La gran mayoría de tus respuestas demuestran un patrón de dependencia o tendencias de orden obsesivo compulsivo, lo cual evoluciona en el tiempo y causará cada día más problemas en tu vida. Es urgente que consiga ayuda profesional.',
    colorTexto: 'text-danger',
    icono: 'fa fa-frown-o',
    total,
  };
};

export const diagnosticoSalud = (
  idDiagnostico: number | null,
  textoDiagnostico: string | null,
  valor: MaybeNumber,
): HealthDiagnosticResult => {
  const total = Math.trunc(toNumber(valor));
  const id = idDiagnostico ?? null;
  const diagnostic = textoDiagnostico ?? null;

  let enunciado: string | null = 'sin rango';
  let colorTexto: string | null = null;
  let icono: string | null = null;

  switch (idDiagnostico) {
    case 195:
      if (total < 9) {
        enunciado = 'Respiración inadecuada';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 11) {
        enunciado = 'Debe mejorar algunos aspectos de su respiración';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 10) {
        enunciado = 'Respiración adecuada';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 196:
      if (total === 43) {
        enunciado = 'Malos habitos de alimentación';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 47) {
        enunciado = 'Debe corregir algunos aspectos de su alimetación';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 46) {
        enunciado = 'Sus habitos de alimentación son sanos';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 197:
      if (total < 4) {
        enunciado = 'Hidratación inadecuada';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 7) {
        enunciado = 'Desbe corregir algunos aspectos de su hidratación';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 6) {
        enunciado = 'Sus habitos de hidratación son sanos';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 198:
      if (total < 25) {
        enunciado = 'Usted tiene problemas de adicción';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 29) {
        enunciado = 'Desbe corregir algunos aspectos de su vida para evitar las adicciones';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 28) {
        enunciado = 'Se puede considerar usted una persona sin adicciones';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 199:
      if (total < 9) {
        enunciado = 'Estreñimiento cronico';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 11) {
        enunciado = 'Estreñimiento';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 10) {
        enunciado = 'No hay estreñimiento';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 200:
      if (total < 5) {
        enunciado = 'Agotamiento';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 8) {
        enunciado = 'Debe revisar lo que le resta energia';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 7) {
        enunciado = 'Es usted una persona con mucha vitalidad';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 201:
      if (total < 7) {
        enunciado = 'Mal dormir';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 11) {
        enunciado = 'Dificultad en el sueño';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 10) {
        enunciado = 'Buen dormir';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 202:
      if (total < 14) {
        enunciado = 'Piel con lesiones';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total > 13) {
        enunciado = 'Piel sana';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 203:
      if (total < 6) {
        enunciado = 'Dificultad con la suduración';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total > 5) {
        enunciado = 'Suduración sana';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 204:
      if (total < 9) {
        enunciado = 'Dificultades para orinar';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 13) {
        enunciado = 'Tenga cuidado con la orina';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 12) {
        enunciado = 'No hay problemas con la orina';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 205:
      if (total < 13) {
        enunciado = 'Hay que revisar esta area de su vida';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total > 12) {
        enunciado = 'Sexualidad sana';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 206:
      if (total < 14) {
        enunciado = 'Dificultades con la mestruación';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total > 13) {
        enunciado = 'Mestruacion sana';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 209:
      if (total < 19) {
        enunciado = 'Mal manejo emocional';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 24) {
        enunciado = 'Debe mejorar sus recursos para el manejo de las emociones';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 23) {
        enunciado = 'Manejo adecuado de sus emociones';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 210:
      if (total < 5) {
        enunciado = 'Sedentarismo';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 7) {
        enunciado = 'Poca actividad fisica';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 6) {
        enunciado = 'Activo ficamente';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 211:
      if (total < 7) {
        enunciado = 'Conciencia ecologica muy baja';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 9) {
        enunciado = 'Debe manejar mejor los recursos';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 8) {
        enunciado = 'Es un buen ejemplo a seguir';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 212:
      if (total < 12) {
        enunciado = 'Depende mucho de la tecnologia';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 16) {
        enunciado = 'Mucho uso de la tecnologia';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 15) {
        enunciado = 'Uso conciente de la tecnologia';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 213:
      if (total < 4) {
        enunciado = 'Es necesario que atienda esta area de su vida';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 5) {
        enunciado = 'Piense en cultivar algún hobbie';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 4) {
        enunciado = 'Area cubierta';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 214:
      if (total < 6) {
        enunciado = 'Insatisfacción a nivel educativo';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 8) {
        enunciado = 'Revise mejor esta area de su vida';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 7) {
        enunciado = 'Nivel educativo satisfecho';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 215:
      if (total < 6) {
        enunciado = 'No se siente bien con los logros alcanzados hasta ahora';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total > 5) {
        enunciado = 'Se siente bien con sus logros';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 216:
      if (total < 6) {
        enunciado = 'Le dedica mucho tiempo al trabajo';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 8) {
        enunciado = 'Debe dedicar menos tiempo al trabajo';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 7) {
        enunciado = 'Relación tiempo trabajo adedcuado';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 217:
      if (total < 3) {
        enunciado = 'Economicamente dependiente';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total > 2) {
        enunciado = 'Economicamente independiente';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 218:
      if (total < 8) {
        enunciado = 'Poca vida social';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 10) {
        enunciado = 'Debe dedicar mas tiempo a sus amigos y conocidos';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 9) {
        enunciado = 'Nivel de visa social satisfecho';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 219:
      if (total < 11) {
        enunciado = 'Relación de pareja mala';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 14) {
        enunciado = 'Relación de pareja regular';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 13) {
        enunciado = 'Buenas relaciones de pareja';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 220:
      if (total < 8) {
        enunciado = 'Relación con la familia mala';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total < 10) {
        enunciado = 'Relaciones con la familia regular';
        colorTexto = 'text-warning';
        icono = 'fa fa-smile-o';
      } else if (total > 9) {
        enunciado = 'Buenas relaciones con la familia';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    case 221:
      if (total < 3) {
        enunciado = 'Desconectado espiritualmente';
        colorTexto = 'text-danger';
        icono = 'fa fa-frown-o';
      } else if (total > 2) {
        enunciado = 'Persona espiritual';
        colorTexto = 'text-success';
        icono = 'fa fa-thumbs-up';
      }
      break;
    default:
      enunciado = 'sin rango';
      colorTexto = null;
      icono = null;
  }

  return {
    id,
    diagnostic,
    enunciado,
    colorTexto,
    icono,
    total,
  };
};

export const revistaDiaria = (valor: MaybeNumber, idTopico: number | null): DailyReviewResult => {
  const total = toNumber(valor);
  const id = idTopico ?? null;

  let enunciado: string | null = null;
  let color: string | null = null;
  let icono: string | null = null;

  switch (idTopico) {
    case 161:
      if (total < 5) {
        enunciado = 'Buen dormir';
        color = 'text-success';
        icono = 'fa fa-thumbs-up';
      } else if (total < 7) {
        enunciado = 'Dificultad en el sueño';
        color = 'text-info';
        icono = 'fa fa-smile-o';
      } else if (total > 6) {
        enunciado = 'Mal dormir';
        color = 'text-danger';
        icono = 'fa fa-frown-o';
      }
      break;
    case 162:
      if (total < 5) {
        enunciado = 'Habitos de alimentación sanos';
        color = 'text-success';
        icono = 'fa fa-thumbs-up';
      } else if (total < 6) {
        enunciado = 'Debe corregir algunos aspestos de su alimentación';
        color = 'text-info';
        icono = 'fa fa-smile-o';
      } else if (total > 5) {
        enunciado = 'Malos habitos de alimentación';
        color = 'text-danger';
        icono = 'fa fa-frown-o';
      }
      break;
    case 163:
      if (total < 3) {
        enunciado = 'Mantenganse así';
        color = 'text-success';
        icono = 'fa fa-thumbs-up';
      } else if (total < 5) {
        enunciado = 'Poca actividad fisica';
        color = 'text-info';
        icono = 'fa fa-smile-o';
      } else if (total > 4) {
        enunciado = 'Puede estar perdiendo la rutina';
        color = 'text-danger';
        icono = 'fa fa-frown-o';
      }
      break;
    case 164:
      if (total < 1) {
        enunciado = 'Mantenganse así';
        color = 'text-success';
        icono = 'fa fa-thumbs-up';
      } else if (total > 0) {
        enunciado = 'Puede estar perdiendo la rutina';
        color = 'text-danger';
        icono = 'fa fa-frown-o';
      }
      break;
    case 165:
      if (total < 5) {
        enunciado = 'No hay estreñimiento';
        color = 'text-success';
        icono = 'fa fa-thumbs-up';
      } else if (total < 7) {
        enunciado = 'Estreñimiento';
        color = 'text-info';
        icono = 'fa fa-smile-o';
      } else if (total > 6) {
        enunciado = 'Estreñimiento cronico';
        color = 'text-danger';
        icono = 'fa fa-frown-o';
      }
      break;
    case 166:
      if (total < 5) {
        enunciado = 'Sus habitos de hidratación son sanos';
        color = 'text-success';
        icono = 'fa fa-thumbs-up';
      } else if (total > 4) {
        enunciado = 'Debe corregir algunos aspectos de su hidratación';
        color = 'text-info';
        icono = 'fa fa-smile-o';
      } else if (total > 7) {
        enunciado = 'Hidratación inadecuada';
        color = 'text-danger';
        icono = 'fa fa-frown-o';
      }
      break;
    case 167:
      if (total < 1) {
        enunciado = 'Mantenganse así';
        color = 'text-success';
        icono = 'fa fa-thumbs-up';
      } else if (total > 0) {
        enunciado = 'Cuidado con sus emociones';
        color = 'text-danger';
        icono = 'fa fa-frown-o';
      }
      break;
    case 168:
      if (total < 1) {
        enunciado = 'Mantenganse así';
        color = 'text-success';
        icono = 'fa fa-thumbs-up';
      } else if (total > 0) {
        enunciado = 'Puede estar somatizando algo';
        color = 'text-danger';
        icono = 'fa fa-frown-o';
      }
      break;
    default:
      break;
  }

  return {
    topicId: id,
    topic: null,
    average: total,
    enunciado,
    color,
    icono,
  };
};

export const buildAttitudinalSummary = (strengths: AttitudinalStrengthResult[]): AttitudinalSummary | null => {
  if (!strengths.length) {
    return null;
  }

  const totalAverage = strengths.reduce((acc, item) => acc + item.average, 0) / strengths.length;
  const percentage = clamp(totalAverage * 20, 0, 100);
  const colorClass = colorValor(totalAverage);
  const ponderacionResult = ponderacion(percentage);

  return {
    average: Number(totalAverage.toFixed(2)),
    percentage,
    colorClass,
    ponderation: ponderacionResult,
  };
};
