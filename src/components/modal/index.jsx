import React from "react";
import { Modal, Backdrop } from "@mui/material";
import { makeStyles, createStyles } from "@mui/styles";
import { useSpring, animated } from "react-spring";

const useStyle = makeStyles((theme) =>
  createStyles((styles) => ({
    modal: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      overflowX: "hidden",
      overflowY: "scroll",
      paddingTop: 30,
      height: "100%",
    },
    paper: {
      backgroundColor: "#f4f4f4",
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
      borderRadius: 30,
    },
  }))
);

const Fade = React.forwardRef(function Fade(props, ref) {
  const { in: open, children, onEnter, onExited, ...other } = props;

  const style = useSpring({
    from: { opacity: 0 },
    to: { opacity: open ? 0.9 : 0 },
    onStart: () => {
      if (open && onEnter) {
        onEnter();
      }
    },
    onRest: () => {
      if (!open && onExited) {
        onExited();
      }
    },
  });

  return (
    <animated.div
      ref={ref}
      style={{
        ...style,
        width: "100%",
        height: "100%",
        maxHeight: "60%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
      {...other}
    >
      {children}
    </animated.div>
  );
});

export const CustomModal = ({
  children,
  isOpen,
  handleCancel,
  handleSubmit,
}) => {
  const classes = useStyle();

  return (
    <Modal
      aria-labelledby="spring-modal-title"
      aria-describedby="spring-modal-description"
      className={classes.modal}
      open={isOpen}
      onClose={handleCancel}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Fade in={isOpen}>
        <div className={classes.paper}>{children}</div>
      </Fade>
    </Modal>
  );
};
