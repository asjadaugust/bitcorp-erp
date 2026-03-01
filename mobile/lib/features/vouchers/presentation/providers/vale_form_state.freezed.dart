// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'vale_form_state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ValeFormState {

 String get numeroVale; String get tipoCombustible;// Diesel, Gasolina
 String get cantidadGalones; String get precioUnitario; String get idEquipo; String get fotoPath; String get notas; bool get isSubmitting; String? get error;
/// Create a copy of ValeFormState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ValeFormStateCopyWith<ValeFormState> get copyWith => _$ValeFormStateCopyWithImpl<ValeFormState>(this as ValeFormState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ValeFormState&&(identical(other.numeroVale, numeroVale) || other.numeroVale == numeroVale)&&(identical(other.tipoCombustible, tipoCombustible) || other.tipoCombustible == tipoCombustible)&&(identical(other.cantidadGalones, cantidadGalones) || other.cantidadGalones == cantidadGalones)&&(identical(other.precioUnitario, precioUnitario) || other.precioUnitario == precioUnitario)&&(identical(other.idEquipo, idEquipo) || other.idEquipo == idEquipo)&&(identical(other.fotoPath, fotoPath) || other.fotoPath == fotoPath)&&(identical(other.notas, notas) || other.notas == notas)&&(identical(other.isSubmitting, isSubmitting) || other.isSubmitting == isSubmitting)&&(identical(other.error, error) || other.error == error));
}


@override
int get hashCode => Object.hash(runtimeType,numeroVale,tipoCombustible,cantidadGalones,precioUnitario,idEquipo,fotoPath,notas,isSubmitting,error);

@override
String toString() {
  return 'ValeFormState(numeroVale: $numeroVale, tipoCombustible: $tipoCombustible, cantidadGalones: $cantidadGalones, precioUnitario: $precioUnitario, idEquipo: $idEquipo, fotoPath: $fotoPath, notas: $notas, isSubmitting: $isSubmitting, error: $error)';
}


}

/// @nodoc
abstract mixin class $ValeFormStateCopyWith<$Res>  {
  factory $ValeFormStateCopyWith(ValeFormState value, $Res Function(ValeFormState) _then) = _$ValeFormStateCopyWithImpl;
@useResult
$Res call({
 String numeroVale, String tipoCombustible, String cantidadGalones, String precioUnitario, String idEquipo, String fotoPath, String notas, bool isSubmitting, String? error
});




}
/// @nodoc
class _$ValeFormStateCopyWithImpl<$Res>
    implements $ValeFormStateCopyWith<$Res> {
  _$ValeFormStateCopyWithImpl(this._self, this._then);

  final ValeFormState _self;
  final $Res Function(ValeFormState) _then;

/// Create a copy of ValeFormState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? numeroVale = null,Object? tipoCombustible = null,Object? cantidadGalones = null,Object? precioUnitario = null,Object? idEquipo = null,Object? fotoPath = null,Object? notas = null,Object? isSubmitting = null,Object? error = freezed,}) {
  return _then(_self.copyWith(
numeroVale: null == numeroVale ? _self.numeroVale : numeroVale // ignore: cast_nullable_to_non_nullable
as String,tipoCombustible: null == tipoCombustible ? _self.tipoCombustible : tipoCombustible // ignore: cast_nullable_to_non_nullable
as String,cantidadGalones: null == cantidadGalones ? _self.cantidadGalones : cantidadGalones // ignore: cast_nullable_to_non_nullable
as String,precioUnitario: null == precioUnitario ? _self.precioUnitario : precioUnitario // ignore: cast_nullable_to_non_nullable
as String,idEquipo: null == idEquipo ? _self.idEquipo : idEquipo // ignore: cast_nullable_to_non_nullable
as String,fotoPath: null == fotoPath ? _self.fotoPath : fotoPath // ignore: cast_nullable_to_non_nullable
as String,notas: null == notas ? _self.notas : notas // ignore: cast_nullable_to_non_nullable
as String,isSubmitting: null == isSubmitting ? _self.isSubmitting : isSubmitting // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ValeFormState].
extension ValeFormStatePatterns on ValeFormState {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ValeFormState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ValeFormState() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ValeFormState value)  $default,){
final _that = this;
switch (_that) {
case _ValeFormState():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ValeFormState value)?  $default,){
final _that = this;
switch (_that) {
case _ValeFormState() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String numeroVale,  String tipoCombustible,  String cantidadGalones,  String precioUnitario,  String idEquipo,  String fotoPath,  String notas,  bool isSubmitting,  String? error)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ValeFormState() when $default != null:
return $default(_that.numeroVale,_that.tipoCombustible,_that.cantidadGalones,_that.precioUnitario,_that.idEquipo,_that.fotoPath,_that.notas,_that.isSubmitting,_that.error);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String numeroVale,  String tipoCombustible,  String cantidadGalones,  String precioUnitario,  String idEquipo,  String fotoPath,  String notas,  bool isSubmitting,  String? error)  $default,) {final _that = this;
switch (_that) {
case _ValeFormState():
return $default(_that.numeroVale,_that.tipoCombustible,_that.cantidadGalones,_that.precioUnitario,_that.idEquipo,_that.fotoPath,_that.notas,_that.isSubmitting,_that.error);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String numeroVale,  String tipoCombustible,  String cantidadGalones,  String precioUnitario,  String idEquipo,  String fotoPath,  String notas,  bool isSubmitting,  String? error)?  $default,) {final _that = this;
switch (_that) {
case _ValeFormState() when $default != null:
return $default(_that.numeroVale,_that.tipoCombustible,_that.cantidadGalones,_that.precioUnitario,_that.idEquipo,_that.fotoPath,_that.notas,_that.isSubmitting,_that.error);case _:
  return null;

}
}

}

/// @nodoc


class _ValeFormState extends ValeFormState {
  const _ValeFormState({this.numeroVale = '', this.tipoCombustible = 'Diesel', this.cantidadGalones = '', this.precioUnitario = '', this.idEquipo = '', this.fotoPath = '', this.notas = '', this.isSubmitting = false, this.error}): super._();
  

@override@JsonKey() final  String numeroVale;
@override@JsonKey() final  String tipoCombustible;
// Diesel, Gasolina
@override@JsonKey() final  String cantidadGalones;
@override@JsonKey() final  String precioUnitario;
@override@JsonKey() final  String idEquipo;
@override@JsonKey() final  String fotoPath;
@override@JsonKey() final  String notas;
@override@JsonKey() final  bool isSubmitting;
@override final  String? error;

/// Create a copy of ValeFormState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ValeFormStateCopyWith<_ValeFormState> get copyWith => __$ValeFormStateCopyWithImpl<_ValeFormState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ValeFormState&&(identical(other.numeroVale, numeroVale) || other.numeroVale == numeroVale)&&(identical(other.tipoCombustible, tipoCombustible) || other.tipoCombustible == tipoCombustible)&&(identical(other.cantidadGalones, cantidadGalones) || other.cantidadGalones == cantidadGalones)&&(identical(other.precioUnitario, precioUnitario) || other.precioUnitario == precioUnitario)&&(identical(other.idEquipo, idEquipo) || other.idEquipo == idEquipo)&&(identical(other.fotoPath, fotoPath) || other.fotoPath == fotoPath)&&(identical(other.notas, notas) || other.notas == notas)&&(identical(other.isSubmitting, isSubmitting) || other.isSubmitting == isSubmitting)&&(identical(other.error, error) || other.error == error));
}


@override
int get hashCode => Object.hash(runtimeType,numeroVale,tipoCombustible,cantidadGalones,precioUnitario,idEquipo,fotoPath,notas,isSubmitting,error);

@override
String toString() {
  return 'ValeFormState(numeroVale: $numeroVale, tipoCombustible: $tipoCombustible, cantidadGalones: $cantidadGalones, precioUnitario: $precioUnitario, idEquipo: $idEquipo, fotoPath: $fotoPath, notas: $notas, isSubmitting: $isSubmitting, error: $error)';
}


}

/// @nodoc
abstract mixin class _$ValeFormStateCopyWith<$Res> implements $ValeFormStateCopyWith<$Res> {
  factory _$ValeFormStateCopyWith(_ValeFormState value, $Res Function(_ValeFormState) _then) = __$ValeFormStateCopyWithImpl;
@override @useResult
$Res call({
 String numeroVale, String tipoCombustible, String cantidadGalones, String precioUnitario, String idEquipo, String fotoPath, String notas, bool isSubmitting, String? error
});




}
/// @nodoc
class __$ValeFormStateCopyWithImpl<$Res>
    implements _$ValeFormStateCopyWith<$Res> {
  __$ValeFormStateCopyWithImpl(this._self, this._then);

  final _ValeFormState _self;
  final $Res Function(_ValeFormState) _then;

/// Create a copy of ValeFormState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? numeroVale = null,Object? tipoCombustible = null,Object? cantidadGalones = null,Object? precioUnitario = null,Object? idEquipo = null,Object? fotoPath = null,Object? notas = null,Object? isSubmitting = null,Object? error = freezed,}) {
  return _then(_ValeFormState(
numeroVale: null == numeroVale ? _self.numeroVale : numeroVale // ignore: cast_nullable_to_non_nullable
as String,tipoCombustible: null == tipoCombustible ? _self.tipoCombustible : tipoCombustible // ignore: cast_nullable_to_non_nullable
as String,cantidadGalones: null == cantidadGalones ? _self.cantidadGalones : cantidadGalones // ignore: cast_nullable_to_non_nullable
as String,precioUnitario: null == precioUnitario ? _self.precioUnitario : precioUnitario // ignore: cast_nullable_to_non_nullable
as String,idEquipo: null == idEquipo ? _self.idEquipo : idEquipo // ignore: cast_nullable_to_non_nullable
as String,fotoPath: null == fotoPath ? _self.fotoPath : fotoPath // ignore: cast_nullable_to_non_nullable
as String,notas: null == notas ? _self.notas : notas // ignore: cast_nullable_to_non_nullable
as String,isSubmitting: null == isSubmitting ? _self.isSubmitting : isSubmitting // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
