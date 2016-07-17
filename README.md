# hotspot

/*
  Страница на которую переадресуется весь трафик. Здесь надо передать начальный адрес чтобы после авторизации пустить куда нужно.
*/
<?php
  Header("HTTP/1.1 511 Network Authentication Required");
  Header("Location: http://address.com/auth.html");
<?


/*
  Страница http://address.com/auth.html?url=https://mail.ru 
*/
<?php
  Header("HTTP/1.0 401 Unauthorized");
<?
<html>
Здесь должна быть форма авторизации
</html>


Очередность 511 и 401 очень важна
